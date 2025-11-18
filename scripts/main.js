// Pokemon Team Builder - Main JavaScript
import { getCurrentUser, onAuthStateChange } from './auth.js';
import { saveTeam } from './team-storage.js';

class PokemonTeamBuilder {
    constructor() {
        this.team = Array(6).fill(null);
        this.pokemonCache = new Map();
        this.typeChart = null;
        this.currentGeneration = 9; // Default to Gen 9 to match HTML
        this.allPokemon = [];
        this.generationData = this.initGenerationData();
        
        this.init();
    }

    async init() {
        this.bindEvents();
        await this.loadTypeChart();
        await this.loadPokemonList();
        await this.loadFromStorage();
        this.updateTypeCoverage();
        this.updateStatsDisplay();
        this.checkSearchInputsOnLoad();
        this.setupAuthListeners();
        this.checkForSavedTeam();
    }

    bindEvents() {
        // Pokemon search
        document.getElementById('pokemon-search').addEventListener('input', this.debounce(this.searchPokemon.bind(this), 300));
        document.getElementById('pokemon-search').addEventListener('input', this.handleSearchInputChange.bind(this));
        document.getElementById('add-pokemon-btn').addEventListener('click', this.handleAddPokemon.bind(this));
        document.getElementById('pokemon-search-clear').addEventListener('click', this.clearPokemonSearch.bind(this));

        // Opponent search
        document.getElementById('opponent-search').addEventListener('input', this.debounce(this.searchOpponent.bind(this), 300));
        document.getElementById('opponent-search').addEventListener('input', this.handleOpponentInputChange.bind(this));
        document.getElementById('opponent-search-clear').addEventListener('click', this.clearOpponentSearch.bind(this));

        // Generation selector
        document.getElementById('generation-select').addEventListener('change', this.handleGenerationChange.bind(this));

        // Reset button
        document.getElementById('reset-btn').addEventListener('click', this.handleReset.bind(this));

        // Save team button
        const saveTeamBtn = document.getElementById('save-team-btn');
        if (saveTeamBtn) {
            saveTeamBtn.addEventListener('click', this.handleSaveTeam.bind(this));
        }

        // Stats controls
        document.getElementById('stat-select').addEventListener('change', this.updateStatsDisplay.bind(this));
        document.getElementById('stat-order-toggle').addEventListener('change', this.updateStatsDisplay.bind(this));

        // Team slots
        document.querySelectorAll('.team-slot').forEach((slot, index) => {
            slot.addEventListener('click', () => this.handleTeamSlotClick(index));
        });

        // Click outside to close search results and action menus
        document.addEventListener('click', (e) => {
            if (!e.target.closest('.action-menu-container')) {
                this.closeAllActionMenus();
            }
            if (!e.target.closest('.pokemon-search') && !e.target.closest('.opponent-search')) {
                this.hideSearchResults();
            }
        });
    }

    // Check for existing content in search inputs on page load
    checkSearchInputsOnLoad() {
        const pokemonInput = document.getElementById('pokemon-search');
        const opponentInput = document.getElementById('opponent-search');
        
        
        // Check Pokemon search input
        if (pokemonInput && pokemonInput.value.trim()) {
            const wrapper = pokemonInput.closest('.search-input-wrapper');
            if (wrapper) {
                wrapper.classList.add('has-content');
            }
        }
        
        // Check opponent search input
        if (opponentInput && opponentInput.value.trim()) {
            const wrapper = opponentInput.closest('.search-input-wrapper');
            if (wrapper) {
                wrapper.classList.add('has-content');
            }
        }
    }

    // Handle search input changes to show/hide clear buttons
    handleSearchInputChange(e) {
        const wrapper = e.target.closest('.search-input-wrapper');
        if (e.target.value.trim()) {
            wrapper.classList.add('has-content');
        } else {
            wrapper.classList.remove('has-content');
        }
    }

    handleOpponentInputChange(e) {
        const wrapper = e.target.closest('.search-input-wrapper');
        if (e.target.value.trim()) {
            wrapper.classList.add('has-content');
        } else {
            wrapper.classList.remove('has-content');
        }
    }

    // Clear button handlers
    clearPokemonSearch() {
        const input = document.getElementById('pokemon-search');
        const wrapper = input.closest('.search-input-wrapper');
        input.value = '';
        wrapper.classList.remove('has-content');
        this.hideSearchResults();
        input.focus();
    }

    clearOpponentSearch() {
        const input = document.getElementById('opponent-search');
        const wrapper = input.closest('.search-input-wrapper');
        input.value = '';
        wrapper.classList.remove('has-content');
        this.hideOpponentResults();
        // Clear battle recommendations
        document.getElementById('battle-recommendations').innerHTML = '<p class="no-opponent">Select an opponent Pokemon to see battle recommendations</p>';
        input.focus();
    }

    debounce(func, wait) {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    }

    initGenerationData() {
        return {
            typeIntroduction: {
                'dark': 2,
                'steel': 2,
                'fairy': 6
            },
            pokemonTypingChanges: {
                // Pokemon that gained/lost types in different generations
                'azumarill': {
                    1: ['water'],
                    2: ['water'],
                    3: ['water'],
                    4: ['water'],
                    5: ['water'],
                    6: ['water', 'fairy'],
                    7: ['water', 'fairy'],
                    8: ['water', 'fairy'],
                    9: ['water', 'fairy']
                },
                'marill': {
                    1: [],
                    2: ['water'],
                    3: ['water'],
                    4: ['water'],
                    5: ['water'],
                    6: ['water', 'fairy'],
                    7: ['water', 'fairy'],
                    8: ['water', 'fairy'],
                    9: ['water', 'fairy']
                },
                'jigglypuff': {
                    1: ['normal'],
                    2: ['normal'],
                    3: ['normal'],
                    4: ['normal'],
                    5: ['normal'],
                    6: ['normal', 'fairy'],
                    7: ['normal', 'fairy'],
                    8: ['normal', 'fairy'],
                    9: ['normal', 'fairy']
                },
                'wigglytuff': {
                    1: ['normal'],
                    2: ['normal'],
                    3: ['normal'],
                    4: ['normal'],
                    5: ['normal'],
                    6: ['normal', 'fairy'],
                    7: ['normal', 'fairy'],
                    8: ['normal', 'fairy'],
                    9: ['normal', 'fairy']
                },
                'clefairy': {
                    1: ['normal'],
                    2: ['normal'],
                    3: ['normal'],
                    4: ['normal'],
                    5: ['normal'],
                    6: ['fairy'],
                    7: ['fairy'],
                    8: ['fairy'],
                    9: ['fairy']
                },
                'clefable': {
                    1: ['normal'],
                    2: ['normal'],
                    3: ['normal'],
                    4: ['normal'],
                    5: ['normal'],
                    6: ['fairy'],
                    7: ['fairy'],
                    8: ['fairy'],
                    9: ['fairy']
                }
            }
        };
    }

    async loadTypeChart() {
        try {
            this.showLoading();
            this.typeChart = {};
            this.typeEffectivenessChart = {};
            
            // Get all types available in current generation
            const allTypes = this.getGenerationTypes();
            
            // Fetch type data for each type
            for (const typeName of allTypes) {
                try {
                    const response = await fetch(`https://pokeapi.co/api/v2/type/${typeName}`);
                    if (!response.ok) continue;
                    
                    const typeData = await response.json();
                    
                    // Build effectiveness chart
                    if (!this.typeEffectivenessChart[typeName]) {
                        this.typeEffectivenessChart[typeName] = {};
                    }
                    
                    // Parse damage relations
                    const damageRelations = typeData.damage_relations;
                    
                    // Double damage to (2x effectiveness)
                    damageRelations.double_damage_to.forEach(type => {
                        this.typeEffectivenessChart[typeName][type.name] = 2;
                    });
                    
                    // Half damage to (0.5x effectiveness)
                    damageRelations.half_damage_to.forEach(type => {
                        this.typeEffectivenessChart[typeName][type.name] = 0.5;
                    });
                    
                    // No damage to (0x effectiveness - immunity)
                    damageRelations.no_damage_to.forEach(type => {
                        this.typeEffectivenessChart[typeName][type.name] = 0;
                    });
                    
                } catch (typeError) {
                    console.error(`Error loading type data for ${typeName}:`, typeError);
                }
            }
            
            console.log('Type effectiveness chart loaded:', this.typeEffectivenessChart);
            // Debug: Check if Electric -> Ground = 0
            if (this.typeEffectivenessChart.electric) {
                console.log('Electric type data:', this.typeEffectivenessChart.electric);
                console.log('Electric vs Ground:', this.typeEffectivenessChart.electric.ground);
            }
            
        } catch (error) {
            console.error('Error loading type chart:', error);
            // Fallback to basic chart if API fails
            this.createFallbackTypeChart();
        } finally {
            this.hideLoading();
        }
    }
    
    createFallbackTypeChart() {
        // Simplified fallback with basic immunities
        this.typeEffectivenessChart = {
            normal: { fighting: 2, ghost: 0 },
            fire: { fire: 0.5, water: 0.5, grass: 2, ice: 2, bug: 2, rock: 0.5, dragon: 0.5, steel: 2 },
            water: { fire: 2, water: 0.5, grass: 0.5, ground: 2, rock: 2, dragon: 0.5 },
            electric: { water: 2, electric: 0.5, grass: 0.5, ground: 0, flying: 2, dragon: 0.5 },
            grass: { fire: 0.5, water: 2, grass: 0.5, poison: 0.5, ground: 2, flying: 0.5, bug: 0.5, rock: 2, dragon: 0.5, steel: 0.5 },
            ice: { fire: 0.5, water: 0.5, grass: 2, ice: 0.5, ground: 2, flying: 2, dragon: 2, steel: 0.5 },
            fighting: { normal: 2, ice: 2, poison: 0.5, flying: 0.5, psychic: 0.5, bug: 0.5, rock: 2, ghost: 0, dark: 2, steel: 2, fairy: 0.5 },
            poison: { grass: 2, poison: 0.5, ground: 0.5, rock: 0.5, ghost: 0.5, steel: 0, fairy: 2 },
            ground: { fire: 2, electric: 2, grass: 0.5, poison: 2, flying: 0, bug: 0.5, rock: 2, steel: 2 },
            flying: { electric: 0.5, grass: 2, ice: 0.5, fighting: 2, bug: 2, rock: 0.5, steel: 0.5 },
            psychic: { fighting: 2, poison: 2, psychic: 0.5, dark: 0, steel: 0.5 },
            bug: { fire: 0.5, grass: 2, fighting: 0.5, poison: 0.5, flying: 0.5, psychic: 2, ghost: 0.5, dark: 2, steel: 0.5, fairy: 0.5 },
            rock: { fire: 2, ice: 2, fighting: 0.5, ground: 0.5, flying: 2, bug: 2, steel: 0.5 },
            ghost: { normal: 0, psychic: 2, ghost: 2, dark: 0.5 },
            dragon: { dragon: 2, steel: 0.5, fairy: 0 },
            dark: { fighting: 0.5, psychic: 2, ghost: 2, dark: 0.5, fairy: 0.5 },
            steel: { fire: 0.5, water: 0.5, electric: 0.5, ice: 2, rock: 2, steel: 0.5, fairy: 2 },
            fairy: { fire: 0.5, fighting: 2, poison: 0.5, dragon: 2, dark: 2, steel: 0.5 }
        };
    }

    async loadPokemonList() {
        try {
            this.showLoading();
            const response = await fetch('https://pokeapi.co/api/v2/pokemon?limit=1000');
            const data = await response.json();
            this.allPokemon = data.results;
        } catch (error) {
            console.error('Error loading Pokemon list:', error);
        } finally {
            this.hideLoading();
        }
    }

    async searchPokemon(event) {
        const query = event.target.value.toLowerCase().trim();
        if (query.length < 2) {
            this.hideSearchResults();
            return;
        }

        const filteredPokemon = this.allPokemon.filter(pokemon => 
            pokemon.name.toLowerCase().includes(query)
        ).slice(0, 10);

        await this.displaySearchResults(filteredPokemon, 'search-results');
    }

    async searchOpponent(event) {
        const query = event.target.value.toLowerCase().trim();
        if (query.length < 2) {
            this.hideOpponentResults();
            return;
        }

        const filteredPokemon = this.allPokemon.filter(pokemon => 
            pokemon.name.toLowerCase().includes(query)
        ).slice(0, 10);

        await this.displaySearchResults(filteredPokemon, 'opponent-results', true);
    }

    async displaySearchResults(pokemonList, containerId, isOpponent = false) {
        const container = document.getElementById(containerId);
        container.innerHTML = '';

        if (pokemonList.length === 0) {
            container.innerHTML = '<div class="search-result-item">No Pokemon found</div>';
            container.classList.add('show');
            return;
        }

        for (const pokemon of pokemonList) {
            const pokemonData = await this.getPokemonData(pokemon.name);
            if (pokemonData) {
                const resultItem = this.createSearchResultItem(pokemonData, isOpponent);
                container.appendChild(resultItem);
            }
        }

        container.classList.add('show');
    }

    createSearchResultItem(pokemonData, isOpponent = false) {
        const item = document.createElement('div');
        item.className = 'search-result-item';
        
        // Get generation-appropriate types
        const adjustedTypes = this.getPokemonTypesForGeneration(pokemonData.name, pokemonData.types);
        
        const typeIcons = adjustedTypes.map(type => 
            `<span class="type-badge type-${type.type.name}">
                <img src="https://archives.bulbagarden.net/media/upload/thumb/a/a0/${this.getTypeIconName(type.type.name)}/16px-${this.getTypeIconName(type.type.name)}" 
                     alt="${type.type.name}" class="type-icon" 
                     onerror="this.style.display='none'">
                ${type.type.name}
            </span>`
        ).join('');

        item.innerHTML = `
            <img src="${pokemonData.sprites.front_default}" alt="${pokemonData.name}" class="pokemon-sprite">
            <div class="pokemon-info">
                <h3>${pokemonData.name}</h3>
                <div class="pokemon-types">${typeIcons}</div>
            </div>
        `;

        item.addEventListener('click', () => {
            if (isOpponent) {
                this.selectOpponent(pokemonData);
            } else {
                this.addPokemonToTeam(pokemonData);
            }
        });

        return item;
    }

    getTypeIconName(typeName) {
        const typeNames = {
            normal: 'Normal_icon_SwSh.png',
            fire: 'Fire_icon_SwSh.png',
            water: 'Water_icon_SwSh.png',
            electric: 'Electric_icon_SwSh.png',
            grass: 'Grass_icon_SwSh.png',
            ice: 'Ice_icon_SwSh.png',
            fighting: 'Fighting_icon_SwSh.png',
            poison: 'Poison_icon_SwSh.png',
            ground: 'Ground_icon_SwSh.png',
            flying: 'Flying_icon_SwSh.png',
            psychic: 'Psychic_icon_SwSh.png',
            bug: 'Bug_icon_SwSh.png',
            rock: 'Rock_icon_SwSh.png',
            ghost: 'Ghost_icon_SwSh.png',
            dragon: 'Dragon_icon_SwSh.png',
            dark: 'Dark_icon_SwSh.png',
            steel: 'Steel_icon_SwSh.png',
            fairy: 'Fairy_icon_SwSh.png'
        };
        return typeNames[typeName] || 'Normal_icon_SwSh.png';
    }

    async getPokemonData(pokemonName) {
        if (this.pokemonCache.has(pokemonName)) {
            return this.pokemonCache.get(pokemonName);
        }

        try {
            const response = await fetch(`https://pokeapi.co/api/v2/pokemon/${pokemonName.toLowerCase()}`);
            if (!response.ok) return null;
            
            const data = await response.json();
            this.pokemonCache.set(pokemonName, data);
            return data;
        } catch (error) {
            console.error(`Error fetching Pokemon data for ${pokemonName}:`, error);
            return null;
        }
    }

    getGenerationTypes() {
        const allTypes = ['normal', 'fire', 'water', 'electric', 'grass', 'ice', 'fighting', 'poison', 'ground', 'flying', 'psychic', 'bug', 'rock', 'ghost', 'dragon'];
        
        // Add generation-specific types
        if (this.currentGeneration >= 2) {
            allTypes.push('dark', 'steel');
        }
        if (this.currentGeneration >= 6) {
            allTypes.push('fairy');
        }
        
        return allTypes;
    }

    getPokemonTypesForGeneration(pokemonName, originalTypes) {
        const name = pokemonName.toLowerCase();
        
        // Check if this Pokemon has generation-specific typing
        if (this.generationData.pokemonTypingChanges[name]) {
            const generationTypes = this.generationData.pokemonTypingChanges[name][this.currentGeneration];
            if (generationTypes && generationTypes.length > 0) {
                return generationTypes.map(type => ({ type: { name: type } }));
            }
        }
        
        // Filter out types that don't exist in current generation
        return originalTypes.filter(typeObj => {
            const typeName = typeObj.type.name;
            const introGeneration = this.generationData.typeIntroduction[typeName];
            return !introGeneration || this.currentGeneration >= introGeneration;
        });
    }

    addPokemonToTeam(pokemonData) {
        const emptySlot = this.team.findIndex(slot => slot === null);
        if (emptySlot === -1) {
            alert('Your team is full! Remove a Pokemon first.');
            return;
        }

        // Adjust Pokemon types for current generation
        const adjustedPokemon = {
            ...pokemonData,
            types: this.getPokemonTypesForGeneration(pokemonData.name, pokemonData.types)
        };

        this.team[emptySlot] = adjustedPokemon;
        this.updateTeamDisplay();
        this.updateTypeCoverage();
        this.updateStatsDisplay();
        this.saveToStorage();
        this.hideSearchResults();
        document.getElementById('pokemon-search').value = '';
    }

    removePokemonFromTeam(index) {
        this.team[index] = null;
        this.updateTeamDisplay();
        this.updateTypeCoverage();
        this.updateStatsDisplay();
        this.saveToStorage();
    }

    updateTeamDisplay() {
        const teamGrid = document.getElementById('team-grid');
        const slots = teamGrid.querySelectorAll('.team-slot');

        slots.forEach((slot, index) => {
            const pokemon = this.team[index];
            if (pokemon) {
                slot.className = 'team-slot filled';
                slot.innerHTML = `
                    <div class="action-menu-container">
                        <button class="action-menu-btn" title="Open in...">
                            <i class="fas fa-external-link-alt"></i>
                        </button>
                        <div class="action-menu-dropdown">
                            <button class="action-menu-item" data-action="bulbapedia">
                                <i class="fab fa-wikipedia-w"></i>
                                <span>Bulbapedia</span>
                            </button>
                            <button class="action-menu-item" data-action="lookup">
                                <i class="fas fa-search"></i>
                                <span>Lookup</span>
                            </button>
                        </div>
                    </div>
                    <button class="remove-btn" title="Remove Pokemon">
                        <i class="fas fa-times"></i>
                    </button>
                    <img src="${pokemon.sprites.front_default}" alt="${pokemon.name}" class="pokemon-sprite">
                    <div class="pokemon-name">${pokemon.name}</div>
                    <div class="pokemon-types">
                        ${pokemon.types.map(type => 
                            `<span class="type-badge type-${type.type.name}">${type.type.name}</span>`
                        ).join('')}
                    </div>
                `;

                // Add event listeners
                slot.querySelector('.remove-btn').addEventListener('click', (e) => {
                    e.stopPropagation();
                    this.removePokemonFromTeam(index);
                });

                const actionMenuBtn = slot.querySelector('.action-menu-btn');
                const actionMenuDropdown = slot.querySelector('.action-menu-dropdown');
                const actionMenuItems = slot.querySelectorAll('.action-menu-item');

                // Toggle dropdown on button click
                actionMenuBtn.addEventListener('click', (e) => {
                    e.stopPropagation();
                    this.toggleActionMenu(slot, actionMenuDropdown);
                });

                // Handle menu item clicks
                actionMenuItems.forEach(item => {
                    item.addEventListener('click', (e) => {
                        e.stopPropagation();
                        const action = item.dataset.action;
                        this.handleActionMenuClick(action, pokemon.name);
                        this.closeAllActionMenus();
                    });
                });
            } else {
                slot.className = 'team-slot empty';
                slot.innerHTML = `
                    <i class="fas fa-plus"></i>
                    <span>Add Pokemon</span>
                `;
            }
        });
    }

    updateTypeCoverage() {
        const typeCoverageContainer = document.getElementById('type-coverage');
        
        if (!this.typeEffectivenessChart || Object.keys(this.typeEffectivenessChart).length === 0) {
            typeCoverageContainer.innerHTML = '<p>Loading type chart...</p>';
            return;
        }

        const allTypes = this.getGenerationTypes();
        const teamCoverage = this.getDetailedTeamCoverage();
        
        typeCoverageContainer.innerHTML = '';

        allTypes.forEach(type => {
            const coverage = teamCoverage[type] || { effectiveness: 'no-effect', label: 'None', pokemon: [] };
            const coverageItem = document.createElement('div');
            coverageItem.className = 'type-coverage-item';
            
            const pokemonDetails = coverage.pokemon.length > 0 
                ? `<div class="coverage-details">
                    ${coverage.pokemon.map((p, index) => {
                        const details = coverage.details && coverage.details[index];
                        const mainReasons = details ? details.reasons.slice(0, 2) : [];
                        
                        return `
                            <div class="coverage-pokemon-item">
                                <div class="coverage-pokemon-left">
                                    <img src="${p.sprites.front_default}" alt="${p.name}" class="coverage-pokemon-icon">
                                    <div class="coverage-pokemon-name">${p.name}</div>
                                </div>
                                <div class="coverage-pokemon-right">
                                    ${mainReasons.length > 0 ? 
                                        `<div class="coverage-pokemon-reasons">${mainReasons.join('\n')}</div>` : 
                                        '<div class="coverage-pokemon-reasons">No specific matchups</div>'
                                    }
                                </div>
                            </div>
                        `;
                    }).join('')}
                   </div>`
                : '<div class="coverage-details"><span class="no-coverage">No team coverage</span></div>';
            
            coverageItem.innerHTML = `
                <div class="coverage-header type-${type}">
                    <div class="type-info">
                        <img src="https://archives.bulbagarden.net/media/upload/thumb/a/a0/${this.getTypeIconName(type)}/32px-${this.getTypeIconName(type)}" 
                             alt="${type}" class="type-icon" 
                             onerror="this.style.display='none'">
                        <div class="type-name">${type}</div>
                    </div>
                </div>
                ${pokemonDetails}
            `;
            
            typeCoverageContainer.appendChild(coverageItem);
        });
    }

    updateStatsDisplay() {
        const statsContainer = document.getElementById('stats-list');
        const selectedStat = document.getElementById('stat-select').value;
        const highestFirst = document.getElementById('stat-order-toggle').checked;
        const orderToggle = document.getElementById('stat-order-toggle').parentElement;
        
        // If "none" is selected, show suggestion text and hide order toggle
        if (selectedStat === 'none') {
            statsContainer.style.display = 'block';
            statsContainer.innerHTML = '<div class="no-stats">Select a stat to see how your Pokemon compare</div>';
            orderToggle.style.display = 'none';
            return;
        }
        
        // Show the stats list and order toggle
        statsContainer.style.display = 'flex';
        orderToggle.style.display = 'flex';
        
        // Get team Pokemon with stats
        const teamWithStats = this.team
            .filter(pokemon => pokemon !== null)
            .map(pokemon => {
                const statValue = this.getPokemonStatValue(pokemon, selectedStat);
                return {
                    pokemon,
                    statValue
                };
            });
        
        // Sort by selected stat
        teamWithStats.sort((a, b) => {
            return highestFirst ? b.statValue - a.statValue : a.statValue - b.statValue;
        });
        
        // Clear and populate stats list
        statsContainer.innerHTML = '';
        
        if (teamWithStats.length === 0) {
            statsContainer.innerHTML = '<div class="no-stats">Add Pokemon to your team to see stats comparison</div>';
            return;
        }
        
        teamWithStats.forEach((item, index) => {
            const statRow = document.createElement('div');
            statRow.className = 'stat-row';
            
            // Determine arrow/dash type based on position and sort order
            const totalPokemon = teamWithStats.length;
            const isTopSection = index < Math.floor(totalPokemon / 3);
            const isBottomSection = index >= totalPokemon - Math.floor(totalPokemon / 3);
            const isMiddleSection = !isTopSection && !isBottomSection;
            
            let arrowClass, iconClass;
            
            if (isMiddleSection) {
                arrowClass = 'arrow-neutral';
                iconClass = 'fas fa-minus';
            } else {
                const showUpArrow = (highestFirst && isTopSection) || (!highestFirst && isBottomSection);
                arrowClass = showUpArrow ? 'arrow-up' : 'arrow-down';
                iconClass = `fas fa-arrow-${showUpArrow ? 'up' : 'down'}`;
            }
            
            statRow.innerHTML = `
                <div class="stat-arrow ${arrowClass}">
                    <i class="${iconClass}"></i>
                </div>
                <img src="${item.pokemon.sprites.front_default}" alt="${item.pokemon.name}" class="stat-pokemon-sprite">
                <div class="stat-pokemon-info">
                    <div class="stat-pokemon-name">${item.pokemon.name}</div>
                    <div class="stat-pokemon-types">
                        ${item.pokemon.types.map(type => 
                            `<span class="type-badge type-${type.type.name}">${type.type.name}</span>`
                        ).join('')}
                    </div>
                </div>
                <div class="stat-value">${item.statValue}</div>
            `;
            
            statsContainer.appendChild(statRow);
        });
    }
    
    getPokemonStatValue(pokemon, statName) {
        // Handle "none" case
        if (statName === 'none') {
            return 0;
        }
        
        if (!pokemon.stats) {
            console.warn(`No stats found for Pokemon: ${pokemon.name}`);
            return 0;
        }
        
        const statMap = {
            'hp': 'hp',
            'attack': 'attack',
            'defense': 'defense',
            'special-attack': 'special-attack',
            'special-defense': 'special-defense',
            'speed': 'speed'
        };
        
        const targetStatName = statMap[statName];
        const stat = pokemon.stats.find(s => s.stat.name === targetStatName);
        const value = stat ? stat.base_stat : 0;
        
        // Debug logging
        if (value === 0 && statName !== 'none') {
            console.warn(`Stat ${statName} (${targetStatName}) not found for ${pokemon.name}. Available stats:`, pokemon.stats.map(s => s.stat.name));
        }
        
        return value;
    }

    getTeamTypes() {
        const types = [];
        this.team.forEach(pokemon => {
            if (pokemon) {
                pokemon.types.forEach(type => {
                    if (!types.includes(type.type.name)) {
                        types.push(type.type.name);
                    }
                });
            }
        });
        return types;
    }

    getDetailedTeamCoverage() {
        const coverage = {};
        const allTypes = this.getGenerationTypes();
        
        // Initialize coverage for all types
        allTypes.forEach(type => {
            coverage[type] = {
                effectiveness: 'no-effect',
                label: 'None',
                pokemon: [],
                details: []
            };
        });
        
        // Check each Pokemon's offensive and defensive coverage
        this.team.forEach(pokemon => {
            if (!pokemon) return;
            
            allTypes.forEach(targetType => {
                const pokemonDetails = {
                    pokemon: pokemon,
                    reasons: []
                };
                
                let hasImmunity = false;
                let hasSuperEffective = false;
                let defensiveMultiplier = 1;
                const reasons = [];
                const resistanceCount = [];
                
                // Check defensive capabilities - calculate combined effectiveness for dual types
                pokemon.types.forEach(pokemonType => {
                    const defenseType = pokemonType.type.name;
                    const incomingEffectiveness = this.getTypeEffectiveness(targetType, defenseType);
                    //console.log(`Type coverage: ${targetType} -> ${defenseType}: ${incomingEffectiveness}`); // Debug
                    
                    if (incomingEffectiveness === 0) {
                        hasImmunity = true;
                        defensiveMultiplier = 0; // Immunity overrides everything
                    } else if (!hasImmunity) {
                        // Only calculate multiplier if not immune
                        defensiveMultiplier *= incomingEffectiveness;
                        
                        if (incomingEffectiveness < 1) {
                            resistanceCount.push(defenseType);
                        }
                    }
                });
                
                // Handle defensive reasons based on combined effectiveness
                if (hasImmunity) {
                    reasons.push(`🛡️ Immune to ${targetType}`);
                } else if (defensiveMultiplier < 1) {
                    if (resistanceCount.length === 2 && pokemon.types.length === 2) {
                        // Both types resist - double resistance
                        reasons.push(`🔸 Double resist ${targetType}`);
                    } else if (resistanceCount.length === 1) {
                        // Single resistance that isn't cancelled out
                        reasons.push(`🔸 Resists ${targetType}`);
                    }
                    // If defensiveMultiplier >= 1 but we had resistances, they were cancelled out by weaknesses
                }
                
                // Check offensive capabilities
                pokemon.types.forEach(pokemonType => {
                    const attackType = pokemonType.type.name;
                    const effectiveness = this.getTypeEffectiveness(attackType, targetType);
                    
                    if (effectiveness > 1) {
                        hasSuperEffective = true;
                        reasons.push(`💪 ${attackType.charAt(0).toUpperCase() + attackType.slice(1)} super effective`);
                    }
                });
                
                pokemonDetails.reasons = reasons;
                
                // Determine overall effectiveness based on what we found
                let effectivenessRating;
                let effectivenessLabel;
                
                if (hasImmunity || (hasSuperEffective && defensiveMultiplier < 1)) {
                    effectivenessRating = 'super-effective';
                    effectivenessLabel = 'Strong';
                } else if (hasSuperEffective || defensiveMultiplier < 1) {
                    effectivenessRating = 'effective';
                    effectivenessLabel = 'Normal';
                } else if (reasons.length > 0) {
                    effectivenessRating = 'not-very-effective';
                    effectivenessLabel = 'Weak';
                } else {
                    return; // Skip if no relevant coverage
                }
                
                // Update coverage if this is better than what we have or add to existing
                if (coverage[targetType].effectiveness === 'no-effect' || 
                    (effectivenessRating === 'super-effective' && coverage[targetType].effectiveness !== 'super-effective') ||
                    (effectivenessRating === 'effective' && coverage[targetType].effectiveness === 'not-very-effective')) {
                    
                    coverage[targetType] = {
                        effectiveness: effectivenessRating,
                        label: effectivenessLabel,
                        pokemon: [],
                        details: []
                    };
                }
                
                // Add Pokemon if it matches the current effectiveness level
                if (effectivenessRating === coverage[targetType].effectiveness &&
                    !coverage[targetType].pokemon.find(p => p.name === pokemon.name)) {
                    
                    coverage[targetType].pokemon.push(pokemon);
                    coverage[targetType].details.push(pokemonDetails);
                }
            });
        });
        
        return coverage;
    }

    getTypeEffectiveness(attackType, defenseType) {
        // Use API-loaded type effectiveness chart
        if (this.typeEffectivenessChart && this.typeEffectivenessChart[attackType]) {
            const effectiveness = this.typeEffectivenessChart[attackType][defenseType];
            
            // Debug log for Electric vs Ground specifically
            if (attackType === 'electric' && defenseType === 'ground') {
                console.log(`DEBUG getTypeEffectiveness: ${attackType} vs ${defenseType}`);
                console.log('Raw effectiveness value:', effectiveness);
                console.log('Type of effectiveness:', typeof effectiveness);
                console.log('Chart exists:', !!this.typeEffectivenessChart[attackType]);
            }
            
            // Explicitly check for 0 (immunity) and undefined/null
            if (effectiveness === 0) {
                return 0; // Immunity
            } else if (effectiveness !== undefined && effectiveness !== null) {
                return effectiveness;
            }
        }
        
        // Fallback to 1 (normal effectiveness) if data not available
        //console.log(`FALLBACK: ${attackType} vs ${defenseType} = 1 (no data found)`);
        return 1;
    }

    selectOpponent(pokemonData) {
        // Adjust opponent Pokemon types for current generation
        const adjustedOpponent = {
            ...pokemonData,
            types: this.getPokemonTypesForGeneration(pokemonData.name, pokemonData.types)
        };
        
        this.analyzeMatchup(adjustedOpponent);
        this.hideOpponentResults();
        document.getElementById('opponent-search').value = pokemonData.name;
        
        // Update clear button visibility after setting the value
        const opponentInput = document.getElementById('opponent-search');
        const wrapper = opponentInput.closest('.search-input-wrapper');
        if (wrapper) {
            wrapper.classList.add('has-content');
        }
    }

    analyzeMatchup(opponentPokemon) {
        const recommendations = [];
        
        // Check if type effectiveness chart is loaded
        if (!this.typeEffectivenessChart || Object.keys(this.typeEffectivenessChart).length === 0) {
            console.warn('Type effectiveness chart not loaded, using fallback');
            this.createFallbackTypeChart();
        }
        
        this.team.forEach((pokemon, index) => {
            if (!pokemon) return;

            let score = 0;
            const reasons = [];
            const offensiveReasons = [];
            const defensiveReasons = [];

            // Offensive analysis - how well this Pokemon attacks the opponent
            pokemon.types.forEach(pokemonType => {
                opponentPokemon.types.forEach(opponentType => {
                    const effectiveness = this.getTypeEffectiveness(pokemonType.type.name, opponentType.type.name);
                    if (effectiveness > 1) {
                        score += 3;
                        offensiveReasons.push(`${pokemonType.type.name} attacks are super effective vs ${opponentType.type.name}`);
                    } else if (effectiveness < 1 && effectiveness > 0) {
                        score -= 1;
                        offensiveReasons.push(`${pokemonType.type.name} attacks are not very effective vs ${opponentType.type.name}`);
                    } else if (effectiveness === 0) {
                        score -= 2;
                        offensiveReasons.push(`${pokemonType.type.name} attacks have no effect on ${opponentType.type.name}`);
                    }
                });
            });

            // Defensive analysis - how well this Pokemon defends against opponent
            opponentPokemon.types.forEach(opponentType => {
                // Check if ANY of this Pokemon's types provide immunity to the opponent's type
                let hasImmunityToThisType = false;
                let hasResistanceToThisType = false;
                let hasWeaknessToThisType = false;
                
                pokemon.types.forEach(pokemonType => {
                    const effectiveness = this.getTypeEffectiveness(opponentType.type.name, pokemonType.type.name);
                    console.log(`${opponentType.type.name} -> ${pokemonType.type.name}: ${effectiveness}`); // Debug
                    
                    if (effectiveness === 0) {
                        hasImmunityToThisType = true;
                    } else if (effectiveness < 1) {
                        hasResistanceToThisType = true;
                    } else if (effectiveness > 1) {
                        hasWeaknessToThisType = true;
                    }
                });
                
                // Immunity overrides everything else
                if (hasImmunityToThisType) {
                    score += 4; // Immunity is very valuable
                    defensiveReasons.push(`🛡️ Immune to ${opponentType.type.name} attacks`);
                } else if (hasResistanceToThisType && !hasWeaknessToThisType) {
                    score += 2;
                    defensiveReasons.push(`🔸 Resists ${opponentType.type.name} attacks`);
                } else if (hasWeaknessToThisType && !hasResistanceToThisType) {
                    score -= 2;
                    defensiveReasons.push(`⚠️ Weak to ${opponentType.type.name} attacks`);
                }
            });

            // Combine reasons, prioritizing the most important ones
            const combinedReasons = [];
            
            // Add immunity reasons first (highest priority)
            const immunityReasons = defensiveReasons.filter(r => r.includes('Immune'));
            combinedReasons.push(...immunityReasons);
            
            // Add super effective offensive reasons
            const superEffectiveReasons = offensiveReasons.filter(r => r.includes('super effective'));
            combinedReasons.push(...superEffectiveReasons);
            
            // Add resistance reasons
            const resistanceReasons = defensiveReasons.filter(r => r.includes('Resists'));
            combinedReasons.push(...resistanceReasons);
            
            // Add weakness reasons
            const weaknessReasons = defensiveReasons.filter(r => r.includes('Weak to'));
            combinedReasons.push(...weaknessReasons);
            
            // Add other offensive reasons
            const otherOffensiveReasons = offensiveReasons.filter(r => !r.includes('super effective'));
            combinedReasons.push(...otherOffensiveReasons);
            
            // Debug log for Krookodile
            if (pokemon.name.toLowerCase() === 'krookodile') {
                console.log('Krookodile analysis:');
                console.log('Defensive reasons:', defensiveReasons);
                console.log('Offensive reasons:', offensiveReasons);
                console.log('Combined reasons:', combinedReasons);
                console.log('Score:', score);
            }

            recommendations.push({
                pokemon,
                score,
                reasons: combinedReasons.slice(0, 3) // Limit to top 3 most important reasons
            });
        });

        // Sort by score (highest first)
        recommendations.sort((a, b) => b.score - a.score);

        this.displayBattleRecommendations(recommendations, opponentPokemon);
    }

    displayBattleRecommendations(recommendations, opponentPokemon) {
        const container = document.getElementById('battle-recommendations');
        
        if (recommendations.length === 0) {
            container.innerHTML = '<p class="no-opponent">Add Pokemon to your team to see recommendations</p>';
            return;
        }

        // Adjust opponent Pokemon types for current generation
        const adjustedOpponent = {
            ...opponentPokemon,
            types: this.getPokemonTypesForGeneration(opponentPokemon.name, opponentPokemon.types)
        };

        // Create opponent type badges
        const opponentTypeIcons = adjustedOpponent.types.map(type => 
            `<span class="type-badge type-${type.type.name}">
                <img src="https://archives.bulbagarden.net/media/upload/thumb/a/a0/${this.getTypeIconName(type.type.name)}/16px-${this.getTypeIconName(type.type.name)}" 
                     alt="${type.type.name}" class="type-icon" 
                     onerror="this.style.display='none'">
                ${type.type.name}
            </span>`
        ).join('');

        container.innerHTML = `
            <div class="opponent-header">
                <img src="${adjustedOpponent.sprites.front_default}" alt="${adjustedOpponent.name}" class="opponent-sprite">
                <div class="opponent-info">
                    <h3>VS ${adjustedOpponent.name}</h3>
                    <div class="opponent-types">${opponentTypeIcons}</div>
                </div>
            </div>
            <h4 style="margin-bottom: 1rem; color: var(--text-primary);">Your Team Matchups:</h4>
            ${recommendations.map(rec => {
                const scoreClass = rec.score > 0 ? 'success' : rec.score < 0 ? 'danger' : 'warning';
                const scoreText = rec.score > 0 ? 'Good' : rec.score < 0 ? 'Poor' : 'Neutral';
                
                // Apply highlighting to reasons
                const highlightedReasons = rec.reasons.map(reason => {
                    if (reason.includes('Immune')) {
                        return `<span class="immunity-highlight">${reason}</span>`;
                    } else if (reason.includes('super effective')) {
                        return `<span class="super-effective-highlight">${reason}</span>`;
                    } else if (reason.includes('Resists')) {
                        return `<span class="resistance-highlight">${reason}</span>`;
                    }
                    return reason;
                }).join('<br>');
                
                return `
                    <div class="recommendation-item">
                        <img src="${rec.pokemon.sprites.front_default}" alt="${rec.pokemon.name}" class="pokemon-sprite">
                        <div class="recommendation-info">
                            <div class="pokemon-name">${rec.pokemon.name}</div>
                            <div class="recommendation-reason">${highlightedReasons || 'No special advantages'}</div>
                        </div>
                        <div class="recommendation-score ${scoreClass}">${scoreText}</div>
                    </div>
                `;
            }).join('')}
        `;
    }

    toggleActionMenu(slot, dropdown) {
        // Close all other dropdowns first
        this.closeAllActionMenus();
        
        // Toggle this dropdown
        const isOpen = dropdown.classList.contains('active');
        if (!isOpen) {
            dropdown.classList.add('active');
            slot.classList.add('menu-open');
        }
    }

    closeAllActionMenus() {
        document.querySelectorAll('.action-menu-dropdown').forEach(dropdown => {
            dropdown.classList.remove('active');
        });
        document.querySelectorAll('.team-slot').forEach(slot => {
            slot.classList.remove('menu-open');
        });
    }

    handleActionMenuClick(action, pokemonName) {
        if (action === 'bulbapedia') {
            this.openBulbapedia(pokemonName);
        } else if (action === 'lookup') {
            this.openLookup(pokemonName);
        }
    }

    formatPokemonNameForBulbapedia(pokemonName) {
        // Handle special cases and format for Bulbapedia URLs
        const name = pokemonName.toLowerCase();
        
        // Paradox Pokemon - convert hyphens to underscores and capitalize each word
        const paradoxPokemon = [
            'scream-tail', 'brute-bonnet', 'flutter-mane', 'slither-wing', 'sandy-shocks',
            'roaring-moon', 'great-tusk', 'walking-wake', 'gouging-fire', 'raging-bolt',
            'iron-bundle', 'iron-hands', 'iron-jugulis', 'iron-moth', 'iron-thorns',
            'iron-treads', 'iron-valiant', 'iron-leaves', 'iron-boulder', 'iron-crown'
        ];
        
        if (paradoxPokemon.includes(name)) {
            // Convert hyphens to underscores and capitalize each word
            return name.split('-').map(word => this.capitalizeFirst(word)).join('_');
        }
        
        // Regional forms
        if (name.includes('-')) {
            const parts = name.split('-');
            if (parts[1] === 'alola' || parts[1] === 'alolan') {
                return this.capitalizeFirst(parts[0]) + ' (Alolan)';
            }
            if (parts[1] === 'galar' || parts[1] === 'galarian') {
                return this.capitalizeFirst(parts[0]) + ' (Galarian)';
            }
            if (parts[1] === 'hisui' || parts[1] === 'hisuian') {
                return this.capitalizeFirst(parts[0]) + ' (Hisuian)';
            }
            if (parts[1] === 'paldea' || parts[1] === 'paldean') {
                return this.capitalizeFirst(parts[0]) + ' (Paldean)';
            }
        }
        
        // Standard formatting - convert hyphens to underscores for other multi-word names
        if (name.includes('-')) {
            return name.split('-').map(word => this.capitalizeFirst(word)).join('_');
        }
        
        return this.capitalizeFirst(name);
    }

    capitalizeFirst(str) {
        return str.charAt(0).toUpperCase() + str.slice(1);
    }

    openBulbapedia(pokemonName) {
        const formattedName = this.formatPokemonNameForBulbapedia(pokemonName);
        const url = `https://bulbapedia.bulbagarden.net/wiki/${formattedName}_(Pokémon)`;
        window.open(url, '_blank');
    }

    openLookup(pokemonName) {
        // Navigate to lookup page with Pokemon name and generation as URL parameters
        const lookupUrl = `lookup.html?pokemon=${encodeURIComponent(pokemonName)}&generation=${this.currentGeneration}`;
        window.location.href = lookupUrl;
    }

    handleAddPokemon() {
        const searchInput = document.getElementById('pokemon-search');
        if (searchInput.value.trim()) {
            this.searchPokemon({ target: searchInput });
        }
    }

    handleTeamSlotClick(index) {
        if (this.team[index] === null) {
            document.getElementById('pokemon-search').focus();
        }
    }

    handleGenerationChange(event) {
        this.currentGeneration = parseInt(event.target.value);
        
        // Update existing team Pokemon with generation-appropriate types
        this.team = this.team.map(pokemon => {
            if (!pokemon) return null;
            
            return {
                ...pokemon,
                types: this.getPokemonTypesForGeneration(pokemon.name, pokemon.types)
            };
        });
        
        // Refresh displays
        this.updateTeamDisplay();
        this.updateTypeCoverage();
        this.updateStatsDisplay();
        this.saveToStorage();
        
        console.log(`Switched to Generation ${this.currentGeneration}`);
    }

    hideSearchResults() {
        document.getElementById('search-results').classList.remove('show');
    }

    hideOpponentResults() {
        document.getElementById('opponent-results').classList.remove('show');
    }

    showLoading() {
        document.getElementById('loading-overlay').classList.remove('hidden');
    }

    hideLoading() {
        document.getElementById('loading-overlay').classList.add('hidden');
    }

    // Local Storage Methods
    saveToStorage() {
        try {
            const data = {
                team: this.team.map(pokemon => pokemon ? {
                    id: pokemon.id,
                    name: pokemon.name,
                    sprites: pokemon.sprites,
                    types: pokemon.types,
                    stats: pokemon.stats
                } : null),
                generation: this.currentGeneration
            };
            localStorage.setItem('poketools-data', JSON.stringify(data));
        } catch (error) {
            console.error('Failed to save to localStorage:', error);
        }
    }

    async loadFromStorage() {
        try {
            // First check if there's a team to load from sessionStorage (from profile)
            const savedTeamData = sessionStorage.getItem('loadTeam');
            if (savedTeamData) {
                try {
                    const teamData = JSON.parse(savedTeamData);
                    sessionStorage.removeItem('loadTeam'); // Clear after loading
                    
                    // Set generation
                    if (teamData.generation) {
                        this.currentGeneration = teamData.generation;
                        document.getElementById('generation-select').value = teamData.generation;
                    }
                    
                    // Load team
                    if (teamData.pokemon) {
                        this.team = await Promise.all(teamData.pokemon.map(async pokemon => {
                            if (!pokemon) return null;
                            
                            // Re-fetch complete Pokemon data to ensure we have all fields
                            const completeData = await this.getPokemonData(pokemon.name);
                            if (completeData) {
                                // Adjust types for current generation
                                return {
                                    ...completeData,
                                    types: this.getPokemonTypesForGeneration(pokemon.name, completeData.types)
                                };
                            }
                            return null;
                        }));
                        
                        this.updateTeamDisplay();
                        this.updateStatsDisplay();
                        this.updateTypeCoverage();
                        this.saveToStorage(); // Save to localStorage for persistence
                        return;
                    }
                } catch (error) {
                    console.error('Error loading team from sessionStorage:', error);
                }
            }
            
            // Otherwise load from localStorage
            const saved = localStorage.getItem('poketools-data');
            if (saved) {
                const data = JSON.parse(saved);
                
                // Restore generation
                if (data.generation) {
                    this.currentGeneration = data.generation;
                    document.getElementById('generation-select').value = data.generation;
                }
                
                // Restore team
                if (data.team) {
                    this.team = await Promise.all(data.team.map(async pokemon => {
                        if (!pokemon) return null;
                        
                        // If stats are missing, re-fetch the complete Pokemon data
                        if (!pokemon.stats) {
                            const completeData = await this.getPokemonData(pokemon.name);
                            if (completeData) {
                                pokemon = completeData;
                            }
                        }
                        
                        // Adjust types for current generation
                        return {
                            ...pokemon,
                            types: this.getPokemonTypesForGeneration(pokemon.name, pokemon.types)
                        };
                    }));
                    
                    this.updateTeamDisplay();
                    this.updateStatsDisplay();
                }
            }
        } catch (error) {
            console.error('Failed to load from localStorage:', error);
        }
    }

    handleReset() {
        // Show confirmation dialog
        const confirmed = confirm(
            'Are you sure you want to reset your team and settings?'
        );
        
        if (confirmed) {
            // Clear localStorage
            localStorage.removeItem('poketools-data');
            
            // Reset team
            this.team = Array(6).fill(null);
            
            // Reset generation
            this.currentGeneration = 9;
            document.getElementById('generation-select').value = 9;
            
            // Clear search inputs
            document.getElementById('pokemon-search').value = '';
            document.getElementById('opponent-search').value = '';
            
            // Update displays
            this.updateTeamDisplay();
            this.updateTypeCoverage();
            this.updateStatsDisplay();
            
            // Clear battle recommendations
            document.getElementById('battle-recommendations').innerHTML = 
                '<p class="no-opponent">Select an opponent Pokemon to see battle recommendations</p>';
            
            // Hide search results
            this.hideSearchResults();
            this.hideOpponentResults();
            
            console.log('Team and settings reset successfully');
        }
    }

    setupAuthListeners() {
        // Listen for auth state changes to show/hide save button
        onAuthStateChange((user) => {
            const saveTeamBtn = document.getElementById('save-team-btn');
            if (saveTeamBtn) {
                if (user) {
                    saveTeamBtn.classList.remove('hidden');
                } else {
                    saveTeamBtn.classList.add('hidden');
                }
            }
        });
    }

    checkForSavedTeam() {
        // Check if there's a team to load from sessionStorage
        const savedTeamData = sessionStorage.getItem('loadTeam');
        if (savedTeamData) {
            // Team will be loaded in loadFromStorage
            return;
        }
        
        // Check auth state on load
        const user = getCurrentUser();
        const saveTeamBtn = document.getElementById('save-team-btn');
        if (saveTeamBtn) {
            if (user) {
                saveTeamBtn.classList.remove('hidden');
            } else {
                saveTeamBtn.classList.add('hidden');
            }
        }
    }

    async handleSaveTeam() {
        const user = getCurrentUser();
        if (!user) {
            alert('Please sign in to save your team.');
            return;
        }

        // Check if team has at least one Pokemon
        const hasPokemon = this.team.some(p => p !== null);
        if (!hasPokemon) {
            alert('Please add at least one Pokemon to your team before saving.');
            return;
        }

        const saveTeamBtn = document.getElementById('save-team-btn');
        if (saveTeamBtn) {
            saveTeamBtn.disabled = true;
            saveTeamBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Saving...';
        }

        try {
            await saveTeam(this.team, this.currentGeneration);
            if (saveTeamBtn) {
                saveTeamBtn.innerHTML = '<i class="fas fa-check"></i> Saved!';
                setTimeout(() => {
                    saveTeamBtn.innerHTML = '<i class="fas fa-save"></i> Save Team';
                    saveTeamBtn.disabled = false;
                }, 2000);
            }
        } catch (error) {
            console.error('Error saving team:', error);
            alert('Failed to save team. Please try again.');
            if (saveTeamBtn) {
                saveTeamBtn.disabled = false;
                saveTeamBtn.innerHTML = '<i class="fas fa-save"></i> Save Team';
            }
        }
    }
}

// Initialize the app when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    new PokemonTeamBuilder();
});
