// Pokemon Team Builder - Main JavaScript
class PokemonTeamBuilder {
    constructor() {
        this.team = Array(6).fill(null);
        this.pokemonCache = new Map();
        this.typeChart = null;
        this.currentGeneration = 8;
        this.allPokemon = [];
        this.generationData = this.initGenerationData();
        
        this.init();
    }

    async init() {
        this.bindEvents();
        await this.loadTypeChart();
        await this.loadPokemonList();
        this.loadFromStorage();
        this.updateTypeCoverage();
    }

    bindEvents() {
        // Pokemon search
        document.getElementById('pokemon-search').addEventListener('input', this.debounce(this.searchPokemon.bind(this), 300));
        document.getElementById('add-pokemon-btn').addEventListener('click', this.handleAddPokemon.bind(this));

        // Opponent search
        document.getElementById('opponent-search').addEventListener('input', this.debounce(this.searchOpponent.bind(this), 300));

        // Generation selector
        document.getElementById('generation-select').addEventListener('change', this.handleGenerationChange.bind(this));

        // Reset button
        document.getElementById('reset-btn').addEventListener('click', this.handleReset.bind(this));

        // Team slots
        document.querySelectorAll('.team-slot').forEach((slot, index) => {
            slot.addEventListener('click', () => this.handleTeamSlotClick(index));
        });

        // Click outside to close search results
        document.addEventListener('click', (e) => {
            if (!e.target.closest('.pokemon-search') && !e.target.closest('.opponent-search')) {
                this.hideSearchResults();
            }
        });
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
            // Type effectiveness chart - simplified version
            this.typeChart = {
                normal: { weakTo: ['fighting'], resistsTo: [], immuneTo: ['ghost'] },
                fire: { weakTo: ['water', 'ground', 'rock'], resistsTo: ['fire', 'grass', 'ice', 'bug', 'steel', 'fairy'], immuneTo: [] },
                water: { weakTo: ['electric', 'grass'], resistsTo: ['fire', 'water', 'ice', 'steel'], immuneTo: [] },
                electric: { weakTo: ['ground'], resistsTo: ['electric', 'flying', 'steel'], immuneTo: [] },
                grass: { weakTo: ['fire', 'ice', 'poison', 'flying', 'bug'], resistsTo: ['water', 'electric', 'grass', 'ground'], immuneTo: [] },
                ice: { weakTo: ['fire', 'fighting', 'rock', 'steel'], resistsTo: ['ice'], immuneTo: [] },
                fighting: { weakTo: ['flying', 'psychic', 'fairy'], resistsTo: ['bug', 'rock', 'dark'], immuneTo: [] },
                poison: { weakTo: ['ground', 'psychic'], resistsTo: ['grass', 'fighting', 'poison', 'bug', 'fairy'], immuneTo: [] },
                ground: { weakTo: ['water', 'grass', 'ice'], resistsTo: ['poison', 'rock'], immuneTo: ['electric'] },
                flying: { weakTo: ['electric', 'ice', 'rock'], resistsTo: ['grass', 'fighting', 'bug'], immuneTo: ['ground'] },
                psychic: { weakTo: ['bug', 'ghost', 'dark'], resistsTo: ['fighting', 'psychic'], immuneTo: [] },
                bug: { weakTo: ['fire', 'flying', 'rock'], resistsTo: ['grass', 'fighting', 'ground'], immuneTo: [] },
                rock: { weakTo: ['water', 'grass', 'fighting', 'ground', 'steel'], resistsTo: ['normal', 'fire', 'poison', 'flying'], immuneTo: [] },
                ghost: { weakTo: ['ghost', 'dark'], resistsTo: ['poison', 'bug'], immuneTo: ['normal', 'fighting'] },
                dragon: { weakTo: ['ice', 'dragon', 'fairy'], resistsTo: ['fire', 'water', 'electric', 'grass'], immuneTo: [] },
                dark: { weakTo: ['fighting', 'bug', 'fairy'], resistsTo: ['ghost', 'dark'], immuneTo: ['psychic'] },
                steel: { weakTo: ['fire', 'fighting', 'ground'], resistsTo: ['normal', 'grass', 'ice', 'flying', 'psychic', 'bug', 'rock', 'dragon', 'steel', 'fairy'], immuneTo: ['poison'] },
                fairy: { weakTo: ['poison', 'steel'], resistsTo: ['fighting', 'bug', 'dark'], immuneTo: ['dragon'] }
            };
        } catch (error) {
            console.error('Error loading type chart:', error);
        }
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
        this.saveToStorage();
        this.hideSearchResults();
        document.getElementById('pokemon-search').value = '';
    }

    removePokemonFromTeam(index) {
        this.team[index] = null;
        this.updateTeamDisplay();
        this.updateTypeCoverage();
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
                    <button class="bulbapedia-btn" title="View on Bulbapedia">
                        <i class="fas fa-external-link-alt"></i>
                    </button>
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

                slot.querySelector('.bulbapedia-btn').addEventListener('click', (e) => {
                    e.stopPropagation();
                    this.openBulbapedia(pokemon.name);
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
        
        if (!this.typeChart) {
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
            
            const pokemonIcons = coverage.pokemon.length > 0 
                ? `<div class="coverage-pokemon">${coverage.pokemon.map(p => 
                    `<img src="${p.sprites.front_default}" alt="${p.name}" class="coverage-pokemon-icon" title="${p.name}">`
                  ).join('')}</div>`
                : '<div class="coverage-pokemon"><span class="no-coverage">—</span></div>';
            
            coverageItem.innerHTML = `
                <img src="https://archives.bulbagarden.net/media/upload/thumb/a/a0/${this.getTypeIconName(type)}/32px-${this.getTypeIconName(type)}" 
                     alt="${type}" class="type-icon" 
                     onerror="this.style.display='none'">
                <div class="type-name">${type}</div>
                <div class="coverage-status coverage-${coverage.effectiveness}">${coverage.label}</div>
                ${pokemonIcons}
            `;
            
            typeCoverageContainer.appendChild(coverageItem);
        });
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
                pokemon: []
            };
        });
        
        // Check each Pokemon's offensive coverage
        this.team.forEach(pokemon => {
            if (!pokemon) return;
            
            pokemon.types.forEach(pokemonType => {
                const attackType = pokemonType.type.name;
                
                allTypes.forEach(defendType => {
                    const effectiveness = this.getTypeEffectiveness(attackType, defendType);
                    
                    if (effectiveness > 1) {
                        // Super effective
                        if (coverage[defendType].effectiveness !== 'super-effective') {
                            coverage[defendType] = {
                                effectiveness: 'super-effective',
                                label: 'Strong',
                                pokemon: []
                            };
                        }
                        if (!coverage[defendType].pokemon.find(p => p.name === pokemon.name)) {
                            coverage[defendType].pokemon.push(pokemon);
                        }
                    } else if (effectiveness === 1 && coverage[defendType].effectiveness === 'no-effect') {
                        // Normal effectiveness (only if we don't already have super effective)
                        coverage[defendType] = {
                            effectiveness: 'effective',
                            label: 'Normal',
                            pokemon: [pokemon]
                        };
                    } else if (effectiveness < 1 && effectiveness > 0 && 
                             coverage[defendType].effectiveness === 'no-effect') {
                        // Not very effective (only if we have nothing better)
                        coverage[defendType] = {
                            effectiveness: 'not-very-effective',
                            label: 'Weak',
                            pokemon: [pokemon]
                        };
                    }
                });
            });
        });
        
        return coverage;
    }

    getTypeEffectiveness(attackType, defenseType) {
        // Simplified type effectiveness calculation
        const chart = {
            normal: { rock: 0.5, ghost: 0, steel: 0.5 },
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

        return chart[attackType]?.[defenseType] || 1;
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
    }

    analyzeMatchup(opponentPokemon) {
        const recommendations = [];
        
        this.team.forEach((pokemon, index) => {
            if (!pokemon) return;

            let score = 0;
            const reasons = [];

            // Type effectiveness analysis
            pokemon.types.forEach(pokemonType => {
                opponentPokemon.types.forEach(opponentType => {
                    const effectiveness = this.getTypeEffectiveness(pokemonType.type.name, opponentType.type.name);
                    if (effectiveness > 1) {
                        score += 2;
                        reasons.push(`${pokemonType.type.name} is super effective vs ${opponentType.type.name}`);
                    } else if (effectiveness < 1 && effectiveness > 0) {
                        score -= 1;
                        reasons.push(`${pokemonType.type.name} is not very effective vs ${opponentType.type.name}`);
                    } else if (effectiveness === 0) {
                        score -= 3;
                        reasons.push(`${pokemonType.type.name} has no effect on ${opponentType.type.name}`);
                    }
                });
            });

            // Defensive analysis
            opponentPokemon.types.forEach(opponentType => {
                pokemon.types.forEach(pokemonType => {
                    const effectiveness = this.getTypeEffectiveness(opponentType.type.name, pokemonType.type.name);
                    if (effectiveness > 1) {
                        score -= 1;
                        reasons.push(`Weak to opponent's ${opponentType.type.name} attacks`);
                    } else if (effectiveness < 1) {
                        score += 1;
                        reasons.push(`Resists opponent's ${opponentType.type.name} attacks`);
                    }
                });
            });

            recommendations.push({
                pokemon,
                score,
                reasons: reasons.slice(0, 2) // Limit to top 2 reasons
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
                
                return `
                    <div class="recommendation-item">
                        <img src="${rec.pokemon.sprites.front_default}" alt="${rec.pokemon.name}" class="pokemon-sprite">
                        <div class="recommendation-info">
                            <div class="pokemon-name">${rec.pokemon.name}</div>
                            <div class="recommendation-reason">${rec.reasons.join(', ') || 'No special advantages'}</div>
                        </div>
                        <div class="recommendation-score ${scoreClass}">${scoreText}</div>
                    </div>
                `;
            }).join('')}
        `;
    }

    openBulbapedia(pokemonName) {
        const formattedName = pokemonName.charAt(0).toUpperCase() + pokemonName.slice(1);
        const url = `https://bulbapedia.bulbagarden.net/wiki/${formattedName}_(Pokémon)#Base_stats`;
        window.open(url, '_blank');
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
                    types: pokemon.types
                } : null),
                generation: this.currentGeneration
            };
            localStorage.setItem('poketools-data', JSON.stringify(data));
        } catch (error) {
            console.error('Failed to save to localStorage:', error);
        }
    }

    loadFromStorage() {
        try {
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
                    this.team = data.team.map(pokemon => {
                        if (!pokemon) return null;
                        
                        // Adjust types for current generation
                        return {
                            ...pokemon,
                            types: this.getPokemonTypesForGeneration(pokemon.name, pokemon.types)
                        };
                    });
                    
                    this.updateTeamDisplay();
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
            this.currentGeneration = 8;
            document.getElementById('generation-select').value = 8;
            
            // Clear search inputs
            document.getElementById('pokemon-search').value = '';
            document.getElementById('opponent-search').value = '';
            
            // Update displays
            this.updateTeamDisplay();
            this.updateTypeCoverage();
            
            // Clear battle recommendations
            document.getElementById('battle-recommendations').innerHTML = 
                '<p class="no-opponent">Select an opponent Pokemon to see battle recommendations</p>';
            
            // Hide search results
            this.hideSearchResults();
            this.hideOpponentResults();
            
            console.log('Team and settings reset successfully');
        }
    }
}

// Initialize the app when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    new PokemonTeamBuilder();
});
