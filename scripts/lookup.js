// Pokemon Lookup - Main JavaScript
class PokemonLookup {
    constructor() {
        this.currentGeneration = 9;
        this.currentPokemon = null;
        this.pokemonCache = new Map();
        this.speciesCache = new Map();
        this.evolutionCache = new Map();
        this.moveCache = new Map();
        this.locationAreaCache = new Map();
        this.allPokemon = [];
        this.typeChart = null;

        this.generationData = this.initGenerationData();
        this.init();
    }

    async init() {
        this.bindEvents();
        await this.loadTypeChart();
        await this.loadPokemonList();
        this.loadFromStorage();

        // Check for URL parameters
        const urlParams = new URLSearchParams(window.location.search);
        const pokemonParam = urlParams.get("pokemon");
        const generationParam = urlParams.get("generation");

        // Set generation if provided in URL
        if (generationParam) {
            const generationValue = parseInt(generationParam);
            if (generationValue >= 1 && generationValue <= 9) {
                this.currentGeneration = generationValue;
                const generationSelect =
                    document.getElementById("generation-select");
                if (generationSelect) {
                    generationSelect.value = generationValue;
                }
            }
        }

        if (pokemonParam) {
            // Set the search input value
            const searchInput = document.getElementById("pokemon-search");
            searchInput.value = pokemonParam;

            // Update clear button visibility
            const wrapper = searchInput.closest(".search-input-wrapper");
            if (wrapper) {
                wrapper.classList.add("has-content");
            }

            // Wait a bit for the page to fully load, then directly load the Pokemon
            setTimeout(async () => {
                try {
                    const pokemonData = await this.getPokemonData(pokemonParam);
                    if (pokemonData) {
                        await this.selectPokemon(pokemonData);
                    } else {
                        console.error(`Pokemon "${pokemonParam}" not found`);
                        // Fallback to search if direct load fails
                        this.searchPokemon({ target: searchInput });
                    }
                } catch (error) {
                    console.error(
                        "Error loading Pokemon from URL parameter:",
                        error
                    );
                    // Fallback to search if there's an error
                    this.searchPokemon({ target: searchInput });
                }
            }, 300);
        }
    }

    bindEvents() {
        // Search functionality
        document
            .getElementById("pokemon-search")
            .addEventListener(
                "input",
                this.debounce(this.searchPokemon.bind(this), 300)
            );
        document
            .getElementById("pokemon-search")
            .addEventListener("input", this.handleSearchInputChange.bind(this));
        document
            .getElementById("search-btn")
            .addEventListener("click", this.handleSearch.bind(this));
        document
            .getElementById("pokemon-search-clear")
            .addEventListener("click", this.clearPokemonSearch.bind(this));

        // Generation selector
        document
            .getElementById("generation-select")
            .addEventListener("change", this.handleGenerationChange.bind(this));

        // Move tabs
        document.querySelectorAll(".move-tab").forEach((tab) => {
            tab.addEventListener("click", this.handleMoveTab.bind(this));
        });

        // Effectiveness tabs
        document.querySelectorAll(".effectiveness-tab").forEach((tab) => {
            tab.addEventListener(
                "click",
                this.handleEffectivenessTab.bind(this)
            );
        });

        // Bulbapedia button
        document
            .getElementById("bulbapedia-btn")
            .addEventListener("click", this.handleBulbapediaClick.bind(this));

        // Random Pokemon button
        document
            .getElementById("random-pokemon-btn")
            .addEventListener("click", this.getRandomPokemon.bind(this));

        // Click outside to close search results
        document.addEventListener("click", (e) => {
            if (!e.target.closest(".pokemon-search")) {
                this.hideSearchResults();
            }
        });

        // Enter key in search
        document
            .getElementById("pokemon-search")
            .addEventListener("keypress", (e) => {
                if (e.key === "Enter") {
                    this.handleSearch();
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
                dark: 2,
                steel: 2,
                fairy: 6,
            },
            pokemonTypingChanges: {
                azumarill: {
                    1: ["water"],
                    2: ["water"],
                    3: ["water"],
                    4: ["water"],
                    5: ["water"],
                    6: ["water", "fairy"],
                    7: ["water", "fairy"],
                    8: ["water", "fairy"],
                    9: ["water", "fairy"],
                },
                marill: {
                    1: [],
                    2: ["water"],
                    3: ["water"],
                    4: ["water"],
                    5: ["water"],
                    6: ["water", "fairy"],
                    7: ["water", "fairy"],
                    8: ["water", "fairy"],
                    9: ["water", "fairy"],
                },
                jigglypuff: {
                    1: ["normal"],
                    2: ["normal"],
                    3: ["normal"],
                    4: ["normal"],
                    5: ["normal"],
                    6: ["normal", "fairy"],
                    7: ["normal", "fairy"],
                    8: ["normal", "fairy"],
                    9: ["normal", "fairy"],
                },
                wigglytuff: {
                    1: ["normal"],
                    2: ["normal"],
                    3: ["normal"],
                    4: ["normal"],
                    5: ["normal"],
                    6: ["normal", "fairy"],
                    7: ["normal", "fairy"],
                    8: ["normal", "fairy"],
                    9: ["normal", "fairy"],
                },
                clefairy: {
                    1: ["normal"],
                    2: ["normal"],
                    3: ["normal"],
                    4: ["normal"],
                    5: ["normal"],
                    6: ["fairy"],
                    7: ["fairy"],
                    8: ["fairy"],
                    9: ["fairy"],
                },
                clefable: {
                    1: ["normal"],
                    2: ["normal"],
                    3: ["normal"],
                    4: ["normal"],
                    5: ["normal"],
                    6: ["fairy"],
                    7: ["fairy"],
                    8: ["fairy"],
                    9: ["fairy"],
                },
            },
            generationRanges: {
                1: { start: 1, end: 151 },
                2: { start: 152, end: 251 },
                3: { start: 252, end: 386 },
                4: { start: 387, end: 493 },
                5: { start: 494, end: 649 },
                6: { start: 650, end: 721 },
                7: { start: 722, end: 809 },
                8: { start: 810, end: 905 },
                9: { start: 906, end: 1025 },
            },
        };
    }

    async loadTypeChart() {
        try {
            this.typeChart = {};

            const allTypes = this.getGenerationTypes();

            for (const typeName of allTypes) {
                try {
                    const response = await fetch(
                        `https://pokeapi.co/api/v2/type/${typeName}`
                    );
                    if (!response.ok) continue;

                    const typeData = await response.json();

                    if (!this.typeChart[typeName]) {
                        this.typeChart[typeName] = {};
                    }

                    const damageRelations = typeData.damage_relations;

                    damageRelations.double_damage_to.forEach((type) => {
                        this.typeChart[typeName][type.name] = 2;
                    });

                    damageRelations.half_damage_to.forEach((type) => {
                        this.typeChart[typeName][type.name] = 0.5;
                    });

                    damageRelations.no_damage_to.forEach((type) => {
                        this.typeChart[typeName][type.name] = 0;
                    });
                } catch (typeError) {
                    console.error(
                        `Error loading type data for ${typeName}:`,
                        typeError
                    );
                }
            }
        } catch (error) {
            console.error("Error loading type chart:", error);
            this.createFallbackTypeChart();
        }
    }

    createFallbackTypeChart() {
        this.typeChart = {
            normal: { fighting: 2, ghost: 0 },
            fire: {
                fire: 0.5,
                water: 0.5,
                grass: 2,
                ice: 2,
                bug: 2,
                rock: 0.5,
                dragon: 0.5,
                steel: 2,
            },
            water: {
                fire: 2,
                water: 0.5,
                grass: 0.5,
                ground: 2,
                rock: 2,
                dragon: 0.5,
            },
            electric: {
                water: 2,
                electric: 0.5,
                grass: 0.5,
                ground: 0,
                flying: 2,
                dragon: 0.5,
            },
            grass: {
                fire: 0.5,
                water: 2,
                grass: 0.5,
                poison: 0.5,
                ground: 2,
                flying: 0.5,
                bug: 0.5,
                rock: 2,
                dragon: 0.5,
                steel: 0.5,
            },
            ice: {
                fire: 0.5,
                water: 0.5,
                grass: 2,
                ice: 0.5,
                ground: 2,
                flying: 2,
                dragon: 2,
                steel: 0.5,
            },
            fighting: {
                normal: 2,
                ice: 2,
                poison: 0.5,
                flying: 0.5,
                psychic: 0.5,
                bug: 0.5,
                rock: 2,
                ghost: 0,
                dark: 2,
                steel: 2,
                fairy: 0.5,
            },
            poison: {
                grass: 2,
                poison: 0.5,
                ground: 0.5,
                rock: 0.5,
                ghost: 0.5,
                steel: 0,
                fairy: 2,
            },
            ground: {
                fire: 2,
                electric: 2,
                grass: 0.5,
                poison: 2,
                flying: 0,
                bug: 0.5,
                rock: 2,
                steel: 2,
            },
            flying: {
                electric: 0.5,
                grass: 2,
                ice: 0.5,
                fighting: 2,
                bug: 2,
                rock: 0.5,
                steel: 0.5,
            },
            psychic: {
                fighting: 2,
                poison: 2,
                psychic: 0.5,
                dark: 0,
                steel: 0.5,
            },
            bug: {
                fire: 0.5,
                grass: 2,
                fighting: 0.5,
                poison: 0.5,
                flying: 0.5,
                psychic: 2,
                ghost: 0.5,
                dark: 2,
                steel: 0.5,
                fairy: 0.5,
            },
            rock: {
                fire: 2,
                ice: 2,
                fighting: 0.5,
                ground: 0.5,
                flying: 2,
                bug: 2,
                steel: 0.5,
            },
            ghost: { normal: 0, psychic: 2, ghost: 2, dark: 0.5 },
            dragon: { dragon: 2, steel: 0.5, fairy: 0 },
            dark: {
                fighting: 0.5,
                psychic: 2,
                ghost: 2,
                dark: 0.5,
                fairy: 0.5,
            },
            steel: {
                fire: 0.5,
                water: 0.5,
                electric: 0.5,
                ice: 2,
                rock: 2,
                steel: 0.5,
                fairy: 2,
            },
            fairy: {
                fire: 0.5,
                fighting: 2,
                poison: 0.5,
                dragon: 2,
                dark: 2,
                steel: 0.5,
            },
        };
    }

    async loadPokemonList() {
        try {
            const response = await fetch(
                "https://pokeapi.co/api/v2/pokemon?limit=2000"
            );
            const data = await response.json();
            this.allPokemon = data.results;
        } catch (error) {
            console.error("Error loading Pokemon list:", error);
        }
    }

    async searchPokemon(event) {
        const query = event.target.value.toLowerCase().trim();
        if (query.length < 2) {
            this.hideSearchResults();
            return;
        }

        // Search by species name first - group by base name
        const speciesMap = new Map(); // Map of baseName -> { speciesData, forms: [] }

        // Search through allPokemon list to find matching species
        for (const pokemon of this.allPokemon) {
            const name = pokemon.name.toLowerCase();

            // Skip mega evolutions
            if (this.isMegaEvolution(name)) {
                continue;
            }

            // Get base name (species name)
            const baseName = this.getBasePokemonName(name);

            // Check if it matches the query
            if (name.includes(query) || baseName.includes(query)) {
                if (!speciesMap.has(baseName)) {
                    speciesMap.set(baseName, { baseName, pokemonList: [] });
                }
                speciesMap.get(baseName).pokemonList.push(pokemon);
            }
        }

        // Limit to 10 species to avoid too many results
        const limitedSpecies = Array.from(speciesMap.values()).slice(0, 10);

        // For each matching species, get all its forms
        const allForms = [];
        for (const { pokemonList } of limitedSpecies) {
            // Use the first Pokemon to get species data
            const firstPokemon = pokemonList[0];
            try {
                const pokemonData = await this.getPokemonData(
                    firstPokemon.name
                );
                if (!pokemonData || !pokemonData.species) continue;

                // Get species data to access all varieties
                const speciesData = await this.getPokemonSpecies(
                    pokemonData.species.url
                );
                if (!speciesData || !speciesData.varieties) continue;

                // Get all valid forms (excluding megas, totems, gmax)
                const validForms = speciesData.varieties.filter((variety) => {
                    const formName = variety.pokemon.name.toLowerCase();
                    return (
                        !this.isMegaEvolution(formName) &&
                        !formName.includes("-totem") &&
                        !formName.includes("-gmax")
                    );
                });

                // Fetch data for each form
                for (const variety of validForms) {
                    try {
                        const formData = await this.getPokemonData(
                            variety.pokemon.name
                        );
                        if (formData) {
                            allForms.push({ formData, speciesData });
                        }
                    } catch (error) {
                        console.warn(
                            `Error loading form ${variety.pokemon.name}:`,
                            error
                        );
                    }
                }
            } catch (error) {
                console.warn(
                    `Error loading species for ${firstPokemon.name}:`,
                    error
                );
            }
        }

        // Limit total results to 15 forms
        await this.displaySearchResults(allForms.slice(0, 15));
    }

    async displaySearchResults(formList) {
        const container = document.getElementById("search-results");
        container.innerHTML = "";

        if (formList.length === 0) {
            container.innerHTML =
                '<div class="search-result-item">No Pokemon found</div>';
            container.classList.add("show");
            return;
        }

        for (const { formData, speciesData } of formList) {
            const resultItem = this.createSearchResultItem(
                formData,
                speciesData
            );
            container.appendChild(resultItem);
        }

        container.classList.add("show");
    }

    createSearchResultItem(pokemonData, speciesData = null) {
        const item = document.createElement("div");
        item.className = "search-result-item";

        const adjustedTypes = this.getPokemonTypesForGeneration(
            pokemonData.name,
            pokemonData.types
        );

        // Get species name for display
        const speciesName = speciesData
            ? speciesData.name
            : this.getBasePokemonName(pokemonData.name.toLowerCase());
        const formattedSpeciesName = this.formatPokemonName(speciesName);

        // Get form name
        const generation = speciesData
            ? this.getGenerationFromSpecies(speciesData)
            : null;
        const formName = this.formatFormName(
            pokemonData.name,
            speciesData,
            generation
        );

        // Build display name: "SpeciesName FormName Form" or just "SpeciesName" if no form
        let displayName;
        if (formName && formName !== formattedSpeciesName) {
            displayName = `${formattedSpeciesName} ${formName} Form`;
        } else {
            displayName = formattedSpeciesName;
        }

        const typeIcons = adjustedTypes
            .map(
                (type) =>
                    `<span class="type-badge type-${type.type.name}">
                ${type.type.name}
            </span>`
            )
            .join("");

        const sprite =
            pokemonData.sprites.front_default ||
            pokemonData.sprites.other?.["official-artwork"]?.front_default ||
            pokemonData.sprites.front_shiny;

        item.innerHTML = `
            <img src="${sprite}" alt="${displayName}" class="pokemon-sprite">
            <div class="pokemon-info">
                <h3>${displayName}</h3>
                <div class="pokemon-types">${typeIcons}</div>
            </div>
        `;

        item.addEventListener("click", () => {
            this.selectPokemon(pokemonData);
        });

        return item;
    }

    async selectPokemon(pokemonData) {
        try {
            this.currentPokemon = pokemonData;
            this.currentPokemonData = pokemonData;

            // Show the pokemon display container immediately
            document.getElementById("no-pokemon").style.display = "none";
            document
                .getElementById("pokemon-display")
                .classList.remove("hidden");

            // Display basic info immediately
            const adjustedPokemon = {
                ...pokemonData,
                types: this.getPokemonTypesForGeneration(
                    pokemonData.name,
                    pokemonData.types
                ),
            };

            await this.displayPokemonHeader(adjustedPokemon);

            // Show skeleton loaders for other sections
            this.showSkeletonLoaders();

            // Load other sections progressively
            this.loadPokemonDataProgressively(adjustedPokemon);

            this.hideSearchResults();

            // Get species name for search field (e.g., "meowstic" not "meowstic-male")
            const speciesName = await this.getSpeciesName(pokemonData);
            document.getElementById("pokemon-search").value = speciesName;

            // Update clear button visibility after setting the value
            const pokemonInput = document.getElementById("pokemon-search");
            const wrapper = pokemonInput.closest(".search-input-wrapper");
            if (wrapper) {
                wrapper.classList.add("has-content");
            }

            this.saveToStorage();
        } catch (error) {
            console.error("Error displaying Pokemon details:", error);
        }
    }

    async loadPokemonDataProgressively(adjustedPokemon) {
        try {
            // Phase 1: Load visible sections immediately (above the fold)
            // These are what users see first, so prioritize them
            await Promise.all([
                this.displayPokemonForms(adjustedPokemon),
                this.displayEvolutionChain(adjustedPokemon),
                this.displayAbilities(adjustedPokemon)
            ]);

            // Phase 2: Display instant calculations (no API calls needed)
            this.displayStats(adjustedPokemon);
            this.displayTypeEffectiveness(adjustedPokemon);
            this.resetEffectivenessTabs();

            // Phase 3: Load heavy sections after visible content is shown
            // Use setTimeout to defer these until after the browser has painted visible content
            setTimeout(() => {
                Promise.all([
                    this.displayMoves(adjustedPokemon).catch(err => {
                        console.error('Error loading moves:', err);
                    }),
                    this.displayLocations(adjustedPokemon).catch(err => {
                        console.error('Error loading locations:', err);
                    })
                ]);
            }, 0);
        } catch (error) {
            console.error("Error in progressive loading:", error);
        }
    }


    showSkeletonLoaders() {
        // Hide forms section by default until we know if there are forms
        document.getElementById("forms-section").classList.add("hidden");

        // Show evolution section by default (will be hidden if no evolutions)
        document.getElementById("evolution-section").classList.remove("hidden");

        // Evolution chain skeleton
        document.getElementById("evolution-chain").innerHTML =
            this.createEvolutionSkeleton();

        // Abilities skeleton
        document.getElementById("abilities-list").innerHTML =
            this.createAbilitiesSkeleton();

        // Stats skeleton (will be replaced quickly)
        document.getElementById("stats-display").innerHTML =
            this.createStatsSkeleton();

        // Type effectiveness skeleton (will be replaced quickly)
        document.getElementById("type-effectiveness").innerHTML =
            this.createTypeEffectivenessSkeleton();

        // Moves skeleton
        document.getElementById("level-up-moves").innerHTML =
            this.createMovesSkeleton();
        document.getElementById("tm-hm-moves").innerHTML =
            this.createMovesSkeleton();

        // Locations skeleton
        document.getElementById("location-display").innerHTML =
            this.createLocationsSkeleton();
    }

    createEvolutionSkeleton() {
        return `
            <div class="skeleton-loader">
                <div class="skeleton-evolution">
                    <div class="skeleton-pokemon-circle"></div>
                    <div class="skeleton-name"></div>
                </div>
                <div class="evolution-branches">
                    <div class="evolution-branch">
                        <div class="skeleton-arrow"></div>
                        <div class="skeleton-evolution">
                            <div class="skeleton-pokemon-circle"></div>
                            <div class="skeleton-name"></div>
                            <div class="skeleton-requirements"></div>
                        </div>
                    </div>
                    <div class="evolution-branch">
                        <div class="skeleton-arrow"></div>
                        <div class="skeleton-evolution">
                            <div class="skeleton-pokemon-circle"></div>
                            <div class="skeleton-name"></div>
                            <div class="skeleton-requirements"></div>
                        </div>
                    </div>
                    <div class="evolution-branch">
                        <div class="skeleton-arrow"></div>
                        <div class="skeleton-evolution">
                            <div class="skeleton-pokemon-circle"></div>
                            <div class="skeleton-name"></div>
                            <div class="skeleton-requirements"></div>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }

    createAbilitiesSkeleton() {
        return `
            <div class="skeleton-loader">
                <div class="skeleton-ability">
                    <div class="skeleton-ability-name"></div>
                    <div class="skeleton-ability-desc"></div>
                    <div class="skeleton-ability-desc short"></div>
                </div>
                <div class="skeleton-ability">
                    <div class="skeleton-ability-name"></div>
                    <div class="skeleton-ability-desc"></div>
                    <div class="skeleton-ability-desc short"></div>
                </div>
            </div>
        `;
    }

    createStatsSkeleton() {
        return `
            <div class="skeleton-loader">
                ${Array(7)
                    .fill(0)
                    .map(
                        () => `
                    <div class="skeleton-stat">
                        <div class="skeleton-stat-name"></div>
                        <div class="skeleton-stat-value"></div>
                    </div>
                `
                    )
                    .join("")}
            </div>
        `;
    }

    createTypeEffectivenessSkeleton() {
        return `
            <div class="skeleton-loader">
                <div class="skeleton-effectiveness-group">
                    <div class="skeleton-group-title"></div>
                    <div class="skeleton-effectiveness-grid">
                        ${Array(4)
                            .fill(0)
                            .map(
                                () => `
                            <div class="skeleton-effectiveness-item">
                                <div class="skeleton-type-name"></div>
                                <div class="skeleton-multiplier"></div>
                            </div>
                        `
                            )
                            .join("")}
                    </div>
                </div>
            </div>
        `;
    }

    createMovesSkeleton() {
        return `
            <div class="skeleton-loader">
                ${Array(6)
                    .fill(0)
                    .map(
                        () => `
                    <div class="skeleton-move">
                        <div class="skeleton-move-name"></div>
                        <div class="skeleton-move-details">
                            <div class="skeleton-move-tag"></div>
                            <div class="skeleton-move-tag"></div>
                            <div class="skeleton-move-tag"></div>
                        </div>
                        <div class="skeleton-move-level"></div>
                    </div>
                `
                    )
                    .join("")}
            </div>
        `;
    }

    createLocationsSkeleton() {
        return `
            <div class="skeleton-loader">
                <div class="skeleton-game-group">
                    <div class="skeleton-game-title"></div>
                    ${Array(3)
                        .fill(0)
                        .map(
                            () => `
                        <div class="skeleton-location">
                            <div class="skeleton-location-name"></div>
                            <div class="skeleton-location-tags">
                                <div class="skeleton-tag"></div>
                                <div class="skeleton-tag"></div>
                                <div class="skeleton-tag"></div>
                            </div>
                        </div>
                    `
                        )
                        .join("")}
                </div>
            </div>
        `;
    }

    async displayPokemonDetails(pokemonData) {
        // This method is kept for backward compatibility but not used in the new flow
        console.warn(
            "displayPokemonDetails is deprecated, use selectPokemon instead"
        );
    }

    async displayPokemonHeader(pokemonData) {
        // Get species name and form name
        const speciesName = await this.getSpeciesName(pokemonData);
        const formName = this.getFormNameForDisplay(
            pokemonData.name,
            speciesName
        );

        // Display species name as main title
        document.getElementById("pokemon-name").textContent =
            this.formatPokemonName(speciesName);

        // Display form name as subtitle if it's different from species name
        const subtitleElement = document.getElementById(
            "pokemon-form-subtitle"
        );
        if (formName && formName !== speciesName) {
            subtitleElement.textContent = formName + " Form";
            subtitleElement.classList.remove("hidden");
        } else {
            subtitleElement.classList.add("hidden");
        }

        // Store both regular and shiny sprites for toggling
        const regularSprite =
            pokemonData.sprites.front_default ||
            pokemonData.sprites.other?.["official-artwork"]?.front_default ||
            pokemonData.sprites.front_shiny;
        const shinySprite =
            pokemonData.sprites.front_shiny ||
            pokemonData.sprites.other?.["official-artwork"]?.front_shiny ||
            pokemonData.sprites.front_default;

        // Store sprites in pokemon data for later use
        pokemonData.regularSprite = regularSprite;
        pokemonData.shinySprite = shinySprite;
        pokemonData.isShiny = false; // Track current state

        // Set initial sprite
        const spriteElement = document.getElementById("pokemon-sprite");
        spriteElement.src = regularSprite;
        spriteElement.alt =
            this.formatPokemonName(speciesName) +
            (formName ? ` (${formName})` : "");

        // Add click handler for sprite toggling
        spriteElement.onclick = () => this.togglePokemonSprite(pokemonData);

        const typesContainer = document.getElementById("pokemon-types");
        const typeIcons = pokemonData.types
            .map(
                (type) =>
                    `<span class="type-badge type-${type.type.name}">
                ${type.type.name}
            </span>`
            )
            .join("");
        typesContainer.innerHTML = typeIcons;

        // Set background gradient based on type(s)
        const primaryType = pokemonData.types[0].type.name;
        const headerSection = document.querySelector(".pokemon-header");

        if (pokemonData.types.length === 2) {
            // Dual-type: gradient between both type colors
            const secondaryType = pokemonData.types[1].type.name;
            headerSection.style.background = `linear-gradient(135deg, var(--type-${primaryType}), var(--type-${secondaryType}))`;
        } else {
            // Single-type: gradient to surface color (existing behavior)
            headerSection.style.background = `linear-gradient(135deg, var(--type-${primaryType}), var(--surface-color))`;
        }
    }

    togglePokemonSprite(pokemonData) {
        const spriteElement = document.getElementById("pokemon-sprite");

        // Toggle the shiny state
        pokemonData.isShiny = !pokemonData.isShiny;

        // Update the sprite source
        if (pokemonData.isShiny) {
            spriteElement.src = pokemonData.shinySprite;
        } else {
            spriteElement.src = pokemonData.regularSprite;
        }
    }

    async displayPokemonForms(pokemonData) {
        try {
            const formsSection = document.getElementById("forms-section");
            const formsContainer = document.getElementById("pokemon-forms");

            // Get species data to access varieties
            const speciesData = await this.getPokemonSpecies(
                pokemonData.species.url
            );
            const varieties = speciesData.varieties || [];

            // Filter out mega evolutions and totems from forms
            const validForms = varieties.filter((variety) => {
                const name = variety.pokemon.name.toLowerCase();
                return (
                    !this.isMegaEvolution(name) &&
                    !name.includes("-totem") &&
                    !name.includes("-gmax")
                );
            });

            // If only one form exists, hide the forms section
            if (validForms.length <= 1) {
                formsSection.classList.add("hidden");
                return;
            }

            // Show the forms section
            formsSection.classList.remove("hidden");
            formsContainer.innerHTML = "";

            // Get generation from species data for determining base form regional adjective
            const generation = this.getGenerationFromSpecies(speciesData);

            // Fetch data for each form
            for (const variety of validForms) {
                try {
                    const formData = await this.getPokemonData(
                        variety.pokemon.name
                    );
                    if (!formData) continue;

                    const formCard = this.createFormCard(
                        formData,
                        pokemonData.name,
                        speciesData,
                        generation
                    );
                    formsContainer.appendChild(formCard);
                } catch (error) {
                    console.warn(
                        `Error loading form ${variety.pokemon.name}:`,
                        error
                    );
                }
            }
        } catch (error) {
            console.error("Error displaying Pokemon forms:", error);
            document.getElementById("forms-section").classList.add("hidden");
        }
    }

    createFormCard(formData, currentPokemonName, speciesData, generation) {
        const card = document.createElement("div");
        card.className = "form-card";

        // Check if this is the current form being viewed
        const isCurrentForm = this.isCurrentPokemonMatch(
            formData.name,
            currentPokemonName
        );
        if (isCurrentForm) {
            card.classList.add("current");
        }

        // Get sprite
        const sprite =
            formData.sprites.front_default ||
            formData.sprites.other?.["official-artwork"]?.front_default ||
            "https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/items/poke-ball.png";

        // Format the form name nicely, passing species data and generation for regional form handling
        const formName = this.formatFormName(
            formData.name,
            speciesData,
            generation
        );

        // Get types
        const types = formData.types
            .map(
                (t) =>
                    `<span class="type-badge type-${t.type.name}">${t.type.name}</span>`
            )
            .join("");

        card.innerHTML = `
            <img src="${sprite}" alt="${formName}">
            <div class="form-name">${formName}</div>
            <div class="form-types">${types}</div>
        `;

        // Add click handler to switch to this form
        card.addEventListener("click", async () => {
            const pokemonData = await this.getPokemonData(formData.name);
            if (pokemonData) {
                this.selectPokemon(pokemonData);
            }
        });

        return card;
    }

    getGenerationFromSpecies(speciesData) {
        // Extract generation number from generation URL
        // e.g., "https://pokeapi.co/api/v2/generation/1/" -> 1
        if (speciesData.generation && speciesData.generation.url) {
            const urlParts = speciesData.generation.url
                .split("/")
                .filter((part) => part);
            const generationPart = urlParts[urlParts.length - 1];
            const generation = parseInt(generationPart);
            if (!isNaN(generation)) {
                return generation;
            }
        }
        return null;
    }

    getRegionalAdjectiveForGeneration(generation) {
        const regionalAdjectives = {
            1: "Kantonian",
            2: "Johtonian",
            3: "Hoennian",
            4: "Sinnohan",
            5: "Unovan",
            6: "Kalosian",
            7: "Alolan",
            8: "Galarian",
            9: "Paldean",
        };
        return regionalAdjectives[generation] || null;
    }

    hasMultipleRegionalForms(speciesData) {
        if (!speciesData || !speciesData.varieties) return false;

        const regionalForms = speciesData.varieties.filter((variety) => {
            const name = variety.pokemon.name.toLowerCase();
            return this.isRegionalForm(name);
        });

        // Return true if there are regional forms (even if just one, we want to show base form adjective)
        return regionalForms.length > 0;
    }

    isBaseForm(pokemonName, speciesData) {
        if (!speciesData || !speciesData.varieties) return false;

        const name = pokemonName.toLowerCase();
        // Check if this is the default variety (base form)
        const defaultVariety = speciesData.varieties.find(
            (v) => v.is_default === true
        );
        if (
            defaultVariety &&
            defaultVariety.pokemon.name.toLowerCase() === name
        ) {
            return true;
        }

        // Also check if it's not a regional form
        return !this.isRegionalForm(name);
    }

    formatFormName(pokemonName, speciesData = null, generation = null) {
        const name = pokemonName.toLowerCase();

        // Special cases for Eiscue
        if (name === "eiscue-ice") return "Ice Face";
        if (name === "eiscue-noice") return "Noice Face";

        // Special cases for Meowstic
        if (name === "meowstic-male" || name === "meowstic") return "Male";
        if (name === "meowstic-female") return "Female";

        // Special cases for other gendered Pokemon
        if (name.endsWith("-male")) return "Male";
        if (name.endsWith("-female")) return "Female";

        // Check if this is a regional form
        const isRegional = this.isRegionalForm(name);

        // Regional forms - return the regional adjective
        if (name.includes("-alola") || name.includes("-alolan"))
            return "Alolan";
        if (name.includes("-galar") || name.includes("-galarian"))
            return "Galarian";
        if (name.includes("-hisui") || name.includes("-hisuian"))
            return "Hisuian";
        if (name.includes("-paldea") || name.includes("-paldean"))
            return "Paldean";

        // If this is the base form (not regional) and there are regional forms,
        // show the base form's regional adjective based on generation
        if (
            !isRegional &&
            speciesData &&
            this.hasMultipleRegionalForms(speciesData)
        ) {
            // Get generation if not provided
            if (!generation) {
                generation = this.getGenerationFromSpecies(speciesData);
            }

            if (generation) {
                const regionalAdjective =
                    this.getRegionalAdjectiveForGeneration(generation);
                if (regionalAdjective) {
                    return regionalAdjective;
                }
            }
        }

        // Wormadam forms
        if (name === "wormadam-plant") return "Plant Cloak";
        if (name === "wormadam-sandy") return "Sandy Cloak";
        if (name === "wormadam-trash") return "Trash Cloak";

        // Rotom forms
        if (name === "rotom") return "Normal";
        if (name === "rotom-heat") return "Heat";
        if (name === "rotom-wash") return "Wash";
        if (name === "rotom-frost") return "Frost";
        if (name === "rotom-fan") return "Fan";
        if (name === "rotom-mow") return "Mow";

        // Castform forms
        if (name === "castform") return "Normal";
        if (name === "castform-sunny") return "Sunny";
        if (name === "castform-rainy") return "Rainy";
        if (name === "castform-snowy") return "Snowy";

        // Deoxys forms
        if (name === "deoxys-normal") return "Normal";
        if (name === "deoxys-attack") return "Attack";
        if (name === "deoxys-defense") return "Defense";
        if (name === "deoxys-speed") return "Speed";

        // Shaymin forms
        if (name === "shaymin-land") return "Land";
        if (name === "shaymin-sky") return "Sky";

        // Giratina forms
        if (name === "giratina-altered") return "Altered";
        if (name === "giratina-origin") return "Origin";

        // Darmanitan forms
        if (name.includes("darmanitan-standard"))
            return name.includes("galar") ? "Galarian Standard" : "Standard";
        if (name.includes("darmanitan-zen"))
            return name.includes("galar") ? "Galarian Zen" : "Zen";

        // Tornadus/Thundurus/Landorus forms
        if (name.endsWith("-incarnate")) return "Incarnate";
        if (name.endsWith("-therian")) return "Therian";

        // Kyurem forms
        if (name === "kyurem") return "Normal";
        if (name === "kyurem-black") return "Black";
        if (name === "kyurem-white") return "White";

        // Zygarde forms
        if (name === "zygarde" || name === "zygarde-50") return "50%";
        if (name === "zygarde-10") return "10%";
        if (name === "zygarde-complete") return "Complete";

        // Oricorio forms
        if (name === "oricorio-baile") return "Baile Style";
        if (name === "oricorio-pom-pom") return "Pom-Pom Style";
        if (name === "oricorio-pau") return "Pa'u Style";
        if (name === "oricorio-sensu") return "Sensu Style";

        // Lycanroc forms
        if (name === "lycanroc-midday") return "Midday";
        if (name === "lycanroc-midnight") return "Midnight";
        if (name === "lycanroc-dusk") return "Dusk";

        // Necrozma forms
        if (name === "necrozma") return "Normal";
        if (name === "necrozma-dusk") return "Dusk Mane";
        if (name === "necrozma-dawn") return "Dawn Wings";
        if (name === "necrozma-ultra") return "Ultra";

        // Urshifu forms
        if (name === "urshifu-single-strike") return "Single Strike";
        if (name === "urshifu-rapid-strike") return "Rapid Strike";

        // Calyrex forms
        if (name === "calyrex") return "Normal";
        if (name === "calyrex-ice") return "Ice Rider";
        if (name === "calyrex-shadow") return "Shadow Rider";

        // Basculegion forms
        if (name === "basculegion-male") return "Male";
        if (name === "basculegion-female") return "Female";

        // Indeedee forms
        if (name === "indeedee-male") return "Male";
        if (name === "indeedee-female") return "Female";

        // Default: try to extract form suffix
        if (name.includes("-")) {
            const parts = name.split("-");
            // Return capitalized form name if it exists
            if (parts.length > 1) {
                return parts
                    .slice(1)
                    .map((p) => p.charAt(0).toUpperCase() + p.slice(1))
                    .join(" ");
            }
        }

        // Default case - just return "Standard" or the formatted name
        return this.formatPokemonName(pokemonName);
    }

    async displayEvolutionChain(pokemonData) {
        try {
            const speciesData = await this.getPokemonSpecies(
                pokemonData.species.url
            );
            const evolutionChain = await this.getEvolutionChain(
                speciesData.evolution_chain.url
            );

            const container = document.getElementById("evolution-chain");
            const section = document.getElementById("evolution-section");
            container.innerHTML = "";

            if (evolutionChain && evolutionChain.chain) {
                // Check if this Pokemon has any evolutions (not just itself)
                const hasEvolutions =
                    evolutionChain.chain.evolves_to &&
                    evolutionChain.chain.evolves_to.length > 0;

                if (!hasEvolutions) {
                    // No evolutions - hide the section
                    section.classList.add("hidden");
                    return;
                }

                // Show the section and build the evolution chain
                section.classList.remove("hidden");
                const evolutionHTML = await this.buildEvolutionChain(
                    evolutionChain.chain,
                    pokemonData.name
                );
                container.innerHTML = evolutionHTML;

                // Add click handlers for evolution Pokemon
                container
                    .querySelectorAll(".evolution-pokemon")
                    .forEach((element) => {
                        element.addEventListener("click", async (e) => {
                            const pokemonName =
                                e.currentTarget.dataset.pokemonName;
                            const pokemonData = await this.getPokemonData(
                                pokemonName
                            );
                            if (pokemonData) {
                                this.selectPokemon(pokemonData);
                            }
                        });
                    });
            } else {
                // No evolution data - hide the section
                section.classList.add("hidden");
            }
        } catch (error) {
            console.error("Error displaying evolution chain:", error);
            document
                .getElementById("evolution-section")
                .classList.add("hidden");
        }
    }

    async buildEvolutionChain(chain, currentPokemonName) {
        const evolutionTree = await this.buildEvolutionTree(
            chain,
            currentPokemonName
        );
        // Post-process to fix any remaining Wormadam requirement issues
        this.fixWormadamRequirements(evolutionTree);
        // Post-process to fix Eiscue forms
        this.fixEiscueForms(evolutionTree, currentPokemonName);
        return this.renderEvolutionTree(evolutionTree);
    }

    fixEiscueForms(tree, currentPokemonName) {
        if (!tree) return;

        // If the current node is Eiscue (any form), consolidate it
        if (
            tree.name &&
            (tree.name === "eiscue" || tree.name.includes("eiscue"))
        ) {
            // Ensure it's displayed as just "Eiscue" with a valid sprite
            tree.name = "eiscue";
            tree.formattedName = "Eiscue";
            if (
                !tree.sprite ||
                tree.sprite.includes("undefined") ||
                !tree.sprite.startsWith("http")
            ) {
                // Try to get a valid sprite - use fallback if needed
                tree.sprite =
                    tree.sprite ||
                    "https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/875.png";
            }
            tree.isCurrent =
                this.isCurrentPokemonMatch("eiscue", currentPokemonName) ||
                this.isCurrentPokemonMatch("eiscue-ice", currentPokemonName) ||
                this.isCurrentPokemonMatch("eiscue-noice", currentPokemonName);
        }

        // Recursively fix Eiscue forms in evolutions
        if (tree.evolutions) {
            for (const evolution of tree.evolutions) {
                this.fixEiscueForms(evolution, currentPokemonName);
            }
        }
    }

    fixWormadamRequirements(evolutionTree) {
        if (!evolutionTree) return;

        // Fix requirements for the current node if it's a Wormadam form
        if (evolutionTree.name && evolutionTree.name.includes("wormadam-")) {
            const formName = this.getWormadamFormName(evolutionTree.name);
            evolutionTree.requirements = `Female only, ${formName}`;
        }

        // Recursively fix requirements for all evolutions
        if (evolutionTree.evolutions) {
            for (const evolution of evolutionTree.evolutions) {
                this.fixWormadamRequirements(evolution);
            }
        }

        // Fix requirements for regional forms
        if (evolutionTree.regionalForms) {
            for (const form of evolutionTree.regionalForms) {
                if (form.name && form.name.includes("wormadam-")) {
                    const formName = this.getWormadamFormName(form.name);
                    form.requirements = `Female only, ${formName}`;
                }
            }
        }
    }

    async buildEvolutionTree(chain, currentPokemonName, depth = 0) {
        if (!chain) return null;

        const pokemonName = chain.species.name;

        // Check for regional forms and mega evolutions
        const allForms = await this.getAllPokemonForms(pokemonName);
        const evolutionDetails = this.selectEvolutionDetailsForGeneration(
            chain.evolution_details
        );

        // Determine if we should use regional form based on current Pokemon
        const currentRegionalType = this.getRegionalType(currentPokemonName);

        // Choose the appropriate form: regional if current Pokemon is regional, otherwise main form
        let pokemonData;
        if (currentRegionalType) {
            // Look for the matching regional form
            const regionalForm = allForms.find(
                (form) =>
                    this.isRegionalForm(form.name) &&
                    this.getRegionalType(form.name) === currentRegionalType
            );

            if (regionalForm) {
                pokemonData = regionalForm;
            } else {
                // If no regional form found, try to fetch it directly
                const regionalName = `${pokemonName}-${currentRegionalType}`;
                try {
                    const regionalPokemon = await this.getPokemonData(
                        regionalName
                    );
                    if (regionalPokemon) {
                        pokemonData = regionalPokemon;
                    } else {
                        pokemonData =
                            allForms.find(
                                (form) =>
                                    !this.isRegionalForm(form.name) &&
                                    !this.isMegaEvolution(form.name)
                            ) || allForms[0];
                    }
                } catch (error) {
                    pokemonData =
                        allForms.find(
                            (form) =>
                                !this.isRegionalForm(form.name) &&
                                !this.isMegaEvolution(form.name)
                        ) || allForms[0];
                }
            }
        } else {
            // Use main form (not regional or mega)
            pokemonData =
                allForms.find(
                    (form) =>
                        !this.isRegionalForm(form.name) &&
                        !this.isMegaEvolution(form.name)
                ) || allForms[0];
        }

        if (!pokemonData) return null;

        const isCurrentPokemon = this.isCurrentPokemonMatch(
            pokemonData.name,
            currentPokemonName
        );

        // Evolution requirements should be empty for the current Pokemon
        // They will be attached to the evolution arrows/branches instead
        let evolutionRequirements = "";

        // Special handling for Wormadam forms - override generic requirements
        if (pokemonData.name.includes("wormadam-")) {
            const formName = this.getWormadamFormName(pokemonData.name);
            evolutionRequirements = `Female only, ${formName}`;
        }

        const node = {
            name: pokemonData.name,
            formattedName: this.formatPokemonName(pokemonData.name),
            sprite: pokemonData.sprites.front_default,
            isCurrent: isCurrentPokemon,
            requirements: evolutionRequirements,
            depth: depth,
            evolutions: [],
            regionalForms: [],
            megaEvolutions: [],
            chainData: chain, // Store the chain data for accessing evolution details
        };

        // Only add regional forms as separate entries if we're NOT currently viewing a regional form
        // (to avoid duplication - when viewing regional form, main chain shows regional sprites)
        if (!currentRegionalType) {
            const regionalForms = allForms.filter((form) =>
                this.isRegionalForm(form.name)
            );
            for (const form of regionalForms) {
                node.regionalForms.push({
                    name: form.name,
                    formattedName: this.formatPokemonName(form.name),
                    sprite: form.sprites.front_default,
                    isCurrent: this.isCurrentPokemonMatch(
                        form.name,
                        currentPokemonName
                    ),
                    requirements: this.getRegionalFormRequirements(form.name),
                });
            }
        }

        // Add mega evolutions only if this is a final evolution (no further evolutions)
        // and the Pokemon can actually mega evolve
        if (chain.evolves_to.length === 0) {
            // Final evolution stage
            const megaEvolutions = allForms.filter((form) =>
                this.isMegaEvolution(form.name)
            );
            for (const mega of megaEvolutions) {
                // Add mega evolutions as regular evolution nodes
                const megaNode = {
                    name: mega.name,
                    formattedName: this.formatMegaEvolutionName(mega.name),
                    sprite: mega.sprites.front_default,
                    isCurrent: this.isCurrentPokemonMatch(
                        mega.name,
                        currentPokemonName
                    ),
                    requirements: this.getMegaEvolutionRequirements(mega.name),
                    depth: depth + 1,
                    evolutions: [],
                    regionalForms: [],
                    megaEvolutions: [],
                    isMegaEvolution: true,
                };
                node.evolutions.push(megaNode);
            }
        }

        // Handle multiple evolution paths
        if (chain.evolves_to && chain.evolves_to.length > 0) {
            for (const evolution of chain.evolves_to) {
                const evolutionNode = await this.buildEvolutionTree(
                    evolution,
                    currentPokemonName,
                    depth + 1
                );
                if (evolutionNode) {
                    node.evolutions.push(evolutionNode);
                }
            }

            // Special handling for complex form-based evolutions like Burmy
            await this.handleSpecialFormEvolutions(
                node,
                pokemonName,
                currentPokemonName,
                depth
            );
        }

        return node;
    }

    renderEvolutionTree(tree) {
        if (!tree) return "";

        let html = "";

        // Render current Pokemon
        html += `
            <div class="evolution-stage">
                <div class="evolution-pokemon ${
                    tree.isCurrent ? "current" : ""
                }" 
                     data-pokemon-name="${tree.name}">
                    <img src="${tree.sprite}" alt="${tree.name}">
                </div>
                <div class="evolution-name">${tree.formattedName}</div>
                
                ${this.renderRegionalForms(tree.regionalForms)}
            </div>
        `;

        // Handle evolutions
        if (tree.evolutions.length > 0) {
            // Separate mega evolutions from regular evolutions
            const regularEvolutions = tree.evolutions.filter(
                (evo) => !evo.isMegaEvolution
            );
            const megaEvolutions = tree.evolutions.filter(
                (evo) => evo.isMegaEvolution
            );

            // Handle regular evolutions first
            if (regularEvolutions.length > 0) {
                if (regularEvolutions.length === 1) {
                    // Single evolution path - linear chain
                    const evolution = regularEvolutions[0];
                    const evolutionRequirements =
                        this.getEvolutionRequirementsForEvolution(
                            tree,
                            evolution
                        );
                    if (evolutionRequirements) {
                        html += `<div class="evolution-arrow"><i class="fas fa-arrow-right"></i><div class="evolution-requirements-between">${evolutionRequirements}</div></div>`;
                    } else {
                        html +=
                            '<div class="evolution-arrow"><i class="fas fa-arrow-right"></i></div>';
                    }

                    html += this.renderEvolutionTree(evolution);
                } else {
                    // Multiple evolution paths - branching
                    html +=
                        '<div class="evolution-branching-indicator"><i class="fas fa-code-branch"></i></div>';
                    html += '<div class="evolution-branches">';

                    for (let i = 0; i < regularEvolutions.length; i++) {
                        const evolution = regularEvolutions[i];
                        // Get the evolution requirements for this specific evolution
                        const evolutionRequirements =
                            this.getEvolutionRequirementsForEvolution(
                                tree,
                                evolution
                            );

                        html += `
                            <div class="evolution-branch">
                                <div class="evolution-connector"><i class="fas fa-arrow-right"></i></div>
                                ${
                                    evolutionRequirements
                                        ? `<div class="evolution-requirements-branch">${evolutionRequirements}</div>`
                                        : ""
                                }
                                ${this.renderEvolutionTree(evolution)}
                            </div>
                        `;
                    }

                    html += "</div>";
                }
            }

            // Handle mega evolutions
            if (megaEvolutions.length > 0) {
                if (megaEvolutions.length === 1) {
                    // Single mega evolution
                    html += '<div class="mega-evolution-arrow">';
                    html +=
                        '<img src="https://archives.bulbagarden.net/media/upload/b/bb/Tretta_Mega_Evolution_icon.png" alt="Mega Evolution" class="mega-evolution-symbol">';
                    html += "</div>";
                    html += this.renderEvolutionTree(megaEvolutions[0]);
                } else {
                    // Multiple mega evolutions
                    html += '<div class="mega-evolution-branching-indicator">';
                    html +=
                        '<img src="https://archives.bulbagarden.net/media/upload/b/bb/Tretta_Mega_Evolution_icon.png" alt="Mega Evolution" class="mega-evolution-symbol">';
                    html += "</div>";
                    html += '<div class="mega-evolution-branches">';

                    for (let i = 0; i < megaEvolutions.length; i++) {
                        const megaEvolution = megaEvolutions[i];

                        html += `
                            <div class="mega-evolution-branch">
                                <div class="mega-evolution-connector"><i class="fas fa-minus"></i></div>
                                ${this.renderEvolutionTree(megaEvolution)}
                            </div>
                        `;
                    }

                    html += "</div>";
                }
            }
        }

        return html;
    }

    renderRegionalForms(regionalForms) {
        if (!regionalForms || regionalForms.length === 0) return "";

        let html = '<div class="regional-forms">';
        for (const form of regionalForms) {
            html += `
                <div class="regional-form">
                    <div class="evolution-connector-regional"><i class="fas fa-globe"></i></div>
                    <div class="evolution-pokemon ${
                        form.isCurrent ? "current" : ""
                    }" 
                         data-pokemon-name="${form.name}">
                        <img src="${form.sprite}" alt="${form.name}">
                    </div>
                    <div class="evolution-name">${form.formattedName}</div>
                    <div class="evolution-requirements">${
                        form.requirements
                    }</div>
                </div>
            `;
        }
        html += "</div>";
        return html;
    }

    // renderMegaEvolutions method removed - mega evolutions now handled inline

    async handleSpecialFormEvolutions(
        node,
        pokemonName,
        currentPokemonName,
        depth
    ) {
        // Handle Pokemon with complex form-based and gender-based evolutions
        if (
            pokemonName === "burmy" ||
            pokemonName.includes("wormadam-") ||
            pokemonName === "mothim"
        ) {
            await this.handleBurmyEvolutionFamily(
                node,
                currentPokemonName,
                depth
            );
        }
        // Handle Espurr/Meowstic evolution (gender-based)
        if (pokemonName === "espurr") {
            await this.handleEspurrEvolution(node, currentPokemonName, depth);
        }
        // Handle Eiscue forms (Ice and Noice are the same pokemon)
        if (pokemonName === "eiscue" || pokemonName.includes("eiscue-")) {
            await this.handleEiscueEvolution(node, currentPokemonName, depth);
        }
        // Handle other complex evolution cases
        // Add more special cases here as needed:
        // if (pokemonName === 'nidoran-f' || pokemonName === 'nidoran-m') {
        //     await this.handleNidoranEvolution(node, currentPokemonName, depth);
        // }
        // if (pokemonName === 'kirlia') {
        //     await this.handleKirliaEvolution(node, currentPokemonName, depth);
        // }
    }

    async handleBurmyEvolutionFamily(node, currentPokemonName, depth) {
        try {
            // Get Wormadam forms for female Burmy evolution
            const wormadamForms = await this.getAllPokemonForms("wormadam");

            // All forms should be the different cloak variants
            const formVariants = wormadamForms.filter(
                (form) =>
                    form.name.includes("wormadam-") || form.name === "wormadam"
            );

            // Find existing evolutions
            const wormadamIndex = node.evolutions.findIndex(
                (evo) =>
                    evo.name === "wormadam" || evo.name.includes("wormadam")
            );

            // Remove any existing generic Wormadam evolution
            if (wormadamIndex !== -1) {
                node.evolutions.splice(wormadamIndex, 1);
            }

            // Add specific Wormadam form evolutions
            for (const form of formVariants) {
                const formName = this.getWormadamFormName(form.name);
                const requirements = `Female only, ${formName}`;

                const formNode = {
                    name: form.name,
                    formattedName: this.formatWormadamFormName(form.name),
                    sprite: form.sprites.front_default,
                    isCurrent: this.isCurrentPokemonMatch(
                        form.name,
                        currentPokemonName
                    ),
                    requirements: requirements,
                    depth: depth + 1,
                    evolutions: [],
                    regionalForms: [],
                    megaEvolutions: [],
                };

                node.evolutions.push(formNode);
            }

            // Also fix any existing Wormadam forms that might already be in the evolution chain
            // This handles the case where we're viewing a Wormadam form and it shows up in its own evolution tree
            for (const evolution of node.evolutions) {
                if (evolution.name.includes("wormadam-")) {
                    const formName = this.getWormadamFormName(evolution.name);
                    evolution.requirements = `Female only, ${formName}`;
                }
            }

            // Find Mothim AFTER we've modified the evolutions array
            const mothimIndex = node.evolutions.findIndex(
                (evo) => evo.name === "mothim"
            );

            // Ensure Mothim has proper gender requirements (add it if it doesn't exist)
            if (mothimIndex !== -1) {
                node.evolutions[mothimIndex].requirements =
                    "Male only, Level 20";
            } else {
                // Add Mothim evolution if it's missing from the evolution chain
                try {
                    const mothimData = await this.getPokemonData("mothim");
                    if (mothimData) {
                        const mothimNode = {
                            name: "mothim",
                            formattedName: "Mothim",
                            sprite: mothimData.sprites.front_default,
                            isCurrent: this.isCurrentPokemonMatch(
                                "mothim",
                                currentPokemonName
                            ),
                            requirements: "Male only, Level 20",
                            depth: depth + 1,
                            evolutions: [],
                            regionalForms: [],
                            megaEvolutions: [],
                        };
                        node.evolutions.push(mothimNode);
                    }
                } catch (error) {
                    console.debug("Could not fetch Mothim data:", error);
                }
            }
        } catch (error) {
            console.warn("Error handling Burmy evolution:", error);
        }
    }

    getWormadamFormName(pokemonName) {
        if (pokemonName.includes("plant")) return "Plant Cloak";
        if (pokemonName.includes("sandy")) return "Sandy Cloak";
        if (pokemonName.includes("trash")) return "Trash Cloak";
        return "Plant Cloak"; // Default
    }

    formatWormadamFormName(pokemonName) {
        if (pokemonName.includes("plant")) return "Wormadam (Plant)";
        if (pokemonName.includes("sandy")) return "Wormadam (Sandy)";
        if (pokemonName.includes("trash")) return "Wormadam (Trash)";
        if (pokemonName === "wormadam") return "Wormadam (Plant)";
        return this.formatPokemonName(pokemonName);
    }

    async handleEspurrEvolution(node, currentPokemonName, depth) {
        try {
            // Get all Meowstic forms
            const meowsticForms = await this.getAllPokemonForms("meowstic");

            // Find and remove any existing Meowstic evolutions (generic or form-specific)
            const meowsticIndices = [];
            node.evolutions.forEach((evo, index) => {
                if (evo.name === "meowstic" || evo.name.includes("meowstic")) {
                    meowsticIndices.push(index);
                }
            });

            // Remove existing Meowstic evolutions (in reverse order to maintain indices)
            for (let i = meowsticIndices.length - 1; i >= 0; i--) {
                node.evolutions.splice(meowsticIndices[i], 1);
            }

            // Add specific Meowstic form evolutions
            // Male Espurr evolves into Meowstic Male
            // Female Espurr evolves into Meowstic Female
            for (const form of meowsticForms) {
                const isMale =
                    form.name.includes("-male") ||
                    form.name === "meowstic-male";
                const isFemale =
                    form.name.includes("-female") ||
                    form.name === "meowstic-female";

                if (isMale || isFemale) {
                    const gender = isMale ? "Male" : "Female";
                    const requirements = `${gender} only, Level 25`;

                    const formNode = {
                        name: form.name,
                        formattedName: `Meowstic (${gender})`,
                        sprite: form.sprites.front_default,
                        isCurrent: this.isCurrentPokemonMatch(
                            form.name,
                            currentPokemonName
                        ),
                        requirements: requirements,
                        depth: depth + 1,
                        evolutions: [],
                        regionalForms: [],
                        megaEvolutions: [],
                    };

                    node.evolutions.push(formNode);
                }
            }

            // If no Meowstic forms were found, try to add them manually
            if (
                node.evolutions.filter((evo) => evo.name.includes("meowstic"))
                    .length === 0
            ) {
                try {
                    // Try to get meowstic-male and meowstic-female directly
                    const maleData = await this.getPokemonData("meowstic-male");
                    const femaleData = await this.getPokemonData(
                        "meowstic-female"
                    );

                    if (maleData) {
                        node.evolutions.push({
                            name: "meowstic-male",
                            formattedName: "Meowstic (Male)",
                            sprite: maleData.sprites.front_default,
                            isCurrent: this.isCurrentPokemonMatch(
                                "meowstic-male",
                                currentPokemonName
                            ),
                            requirements: "Male only, Level 25",
                            depth: depth + 1,
                            evolutions: [],
                            regionalForms: [],
                            megaEvolutions: [],
                        });
                    }

                    if (femaleData) {
                        node.evolutions.push({
                            name: "meowstic-female",
                            formattedName: "Meowstic (Female)",
                            sprite: femaleData.sprites.front_default,
                            isCurrent: this.isCurrentPokemonMatch(
                                "meowstic-female",
                                currentPokemonName
                            ),
                            requirements: "Female only, Level 25",
                            depth: depth + 1,
                            evolutions: [],
                            regionalForms: [],
                            megaEvolutions: [],
                        });
                    }
                } catch (error) {
                    console.debug(
                        "Could not fetch Meowstic forms directly:",
                        error
                    );
                }
            }
        } catch (error) {
            console.warn("Error handling Espurr evolution:", error);
        }
    }

    async handleEiscueEvolution(node, currentPokemonName, depth) {
        try {
            // Eiscue has two forms: Ice and Noice, but they're the same pokemon
            // We should consolidate them to show just one Eiscue entry
            const eiscueForms = await this.getAllPokemonForms("eiscue");

            // Find existing Eiscue evolutions
            const eiscueIndices = [];
            node.evolutions.forEach((evo, index) => {
                if (evo.name === "eiscue" || evo.name.includes("eiscue")) {
                    eiscueIndices.push(index);
                }
            });

            // Remove all existing Eiscue evolutions
            for (let i = eiscueIndices.length - 1; i >= 0; i--) {
                node.evolutions.splice(eiscueIndices[i], 1);
            }

            // Add a single Eiscue entry (prefer Ice form, but show as just "Eiscue")
            let iceForm = eiscueForms.find(
                (form) => form.name === "eiscue-ice" || form.name === "eiscue"
            );

            // If not found, try to get it directly
            if (!iceForm) {
                try {
                    iceForm = await this.getPokemonData("eiscue-ice");
                } catch (error) {
                    // Try base form
                    try {
                        iceForm = await this.getPokemonData("eiscue");
                    } catch (error2) {
                        iceForm = eiscueForms[0];
                    }
                }
            }

            if (iceForm) {
                // Ensure we have a valid sprite
                const sprite =
                    iceForm.sprites?.front_default ||
                    iceForm.sprites?.other?.["official-artwork"]
                        ?.front_default ||
                    iceForm.sprites?.front_shiny ||
                    "https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/875.png"; // Fallback Eiscue sprite

                const eiscueNode = {
                    name: "eiscue",
                    formattedName: "Eiscue",
                    sprite: sprite,
                    isCurrent:
                        this.isCurrentPokemonMatch(
                            "eiscue",
                            currentPokemonName
                        ) ||
                        this.isCurrentPokemonMatch(
                            "eiscue-ice",
                            currentPokemonName
                        ) ||
                        this.isCurrentPokemonMatch(
                            "eiscue-noice",
                            currentPokemonName
                        ),
                    requirements: node.requirements || "",
                    depth: depth + 1,
                    evolutions: [],
                    regionalForms: [],
                    megaEvolutions: [],
                };

                node.evolutions.push(eiscueNode);
            }
        } catch (error) {
            console.warn("Error handling Eiscue evolution:", error);
        }
    }

    getBasePokemonName(pokemonName) {
        // Get the base Pokemon name by removing form suffixes
        const name = pokemonName.toLowerCase();

        // Remove common form suffixes
        const formSuffixes = [
            "-male",
            "-female",
            "-ice",
            "-noice",
            "-mega",
            "-mega-x",
            "-mega-y",
            "-alola",
            "-galar",
            "-hisui",
            "-paldea",
            "-alolan",
            "-galarian",
            "-hisuian",
            "-paldean",
            "-plant",
            "-sandy",
            "-trash",
            "-sunny",
            "-rainy",
            "-snowy",
            "-overcast",
            "-normal",
            "-attack",
            "-defense",
            "-speed",
            "-zen",
            "-therian",
            "-incarnate",
            "-origin",
            "-altered",
            "-sky",
            "-land",
            "-black",
            "-white",
            "-red",
            "-blue",
        ];

        for (const suffix of formSuffixes) {
            if (name.endsWith(suffix)) {
                return name.slice(0, -suffix.length);
            }
        }

        // For names with hyphens, try to extract base name
        // But keep names that are legitimately multi-word (like "mr-mime")
        const hyphenIndex = name.lastIndexOf("-");
        if (hyphenIndex > 0) {
            // Check if it's a known multi-word Pokemon name
            const multiWordPokemon = [
                "mr-mime",
                "mime-jr",
                "type-null",
                "nidoran-f",
                "nidoran-m",
                "farfetchd",
                "sirfetchd",
                "scream-tail",
                "brute-bonnet",
                "flutter-mane",
                "slither-wing",
                "sandy-shocks",
                "roaring-moon",
                "great-tusk",
                "walking-wake",
                "gouging-fire",
                "raging-bolt",
                "iron-bundle",
                "iron-hands",
                "iron-jugulis",
                "iron-moth",
                "iron-thorns",
                "iron-treads",
                "iron-valiant",
                "iron-leaves",
                "iron-boulder",
                "iron-crown",
            ];

            if (!multiWordPokemon.includes(name)) {
                // Likely a form suffix, return the base name
                return name.substring(0, hyphenIndex);
            }
        }

        return name;
    }

    selectEvolutionDetailsForGeneration(evolutionDetailsArray) {
        if (!evolutionDetailsArray || evolutionDetailsArray.length === 0) {
            return null;
        }

        // If only one evolution method, return it
        if (evolutionDetailsArray.length === 1) {
            return evolutionDetailsArray[0];
        }

        // For Pokemon with multiple evolution methods (like Eevee or Magnezone),
        // try to find the method most appropriate for the current generation

        // Priority order: prefer simpler/more common methods for earlier generations
        const generationPreferences = {
            1: ["level-up", "trade", "use-item"],
            2: ["level-up", "trade", "use-item", "level-up-friendship"],
            3: [
                "level-up",
                "trade",
                "use-item",
                "level-up-friendship",
                "level-up-beauty",
            ],
            4: [
                "level-up",
                "trade",
                "use-item",
                "level-up-friendship",
                "other",
            ],
            5: [
                "level-up",
                "trade",
                "use-item",
                "level-up-friendship",
                "other",
            ],
            6: [
                "level-up",
                "trade",
                "use-item",
                "level-up-friendship",
                "other",
            ],
            7: [
                "level-up",
                "trade",
                "use-item",
                "level-up-friendship",
                "other",
            ],
            8: [
                "use-item",
                "level-up",
                "trade",
                "level-up-friendship",
                "other",
            ], // Gen 8 prefers stones
            9: [
                "use-item",
                "level-up",
                "trade",
                "level-up-friendship",
                "other",
            ], // Gen 9 prefers stones
        };

        const preferences =
            generationPreferences[this.currentGeneration] ||
            generationPreferences[9];

        // Score each evolution method based on generation preferences
        let bestDetails = evolutionDetailsArray[0];
        let bestScore = -1;

        for (const details of evolutionDetailsArray) {
            let score = 0;
            const trigger = details.trigger?.name || "other";

            // Heavily favor location-based evolution for current generation
            if (details.location) {
                const locationName = details.location.name;

                // Check if this location is appropriate for current generation
                const generationLocationMap = {
                    "mt-coronet": 4,
                    "chargestone-cave": 5,
                    "eterna-forest": 4,
                    "pinwheel-forest": 5,
                    "route-20": 6,
                    "lush-jungle": 7,
                    "route-217": 4,
                    "twist-mountain": 5,
                    "frost-cavern": 6,
                    "mount-lanakila": 7,
                };

                const locationGeneration = generationLocationMap[locationName];
                if (locationGeneration === this.currentGeneration) {
                    score = 200; // Heavily favor correct generation location
                } else if (
                    locationGeneration &&
                    locationGeneration < this.currentGeneration
                ) {
                    score = 50; // Lower score for older generation locations
                } else {
                    score = 80; // Default location score
                }
            }
            // Handle special cases
            else if (details.item && this.currentGeneration >= 8) {
                // Gen 8+ prefers stone evolution for many Pokemon
                score = 100;
            } else if (
                details.min_level &&
                !details.location &&
                !details.item
            ) {
                // Simple level-up evolution
                score = 90;
            } else {
                // Use trigger-based scoring
                const triggerIndex = preferences.indexOf(trigger);
                score =
                    triggerIndex >= 0
                        ? (preferences.length - triggerIndex) * 10
                        : 1;
            }

            // Bonus for methods that match generation capabilities
            if (details.min_happiness && this.currentGeneration >= 2)
                score += 5;
            if (details.time_of_day && this.currentGeneration >= 2) score += 5;
            if (details.min_beauty && this.currentGeneration >= 3) score += 5;
            if (details.min_affection && this.currentGeneration >= 6)
                score += 5;

            if (score > bestScore) {
                bestScore = score;
                bestDetails = details;
            }
        }

        return bestDetails;
    }

    getEvolutionRequirements(evolutionDetails, currentPokemonName = "") {
        if (!evolutionDetails) return "";

        const requirements = [];

        // Level requirement
        if (evolutionDetails.min_level) {
            requirements.push(`Level ${evolutionDetails.min_level}`);
        }

        // Item requirement (stones, held items, etc.)
        if (evolutionDetails.item) {
            const itemName = this.formatItemName(evolutionDetails.item.name);
            requirements.push(`Use ${itemName}`);
        }

        // Friendship/Happiness requirement
        if (evolutionDetails.min_happiness) {
            if (evolutionDetails.min_happiness >= 220) {
                requirements.push("High Friendship");
            } else {
                requirements.push(
                    `Friendship ${evolutionDetails.min_happiness}+`
                );
            }
        }

        // Time of day requirement
        if (evolutionDetails.time_of_day) {
            const timeText = this.capitalizeFirst(evolutionDetails.time_of_day);
            requirements.push(`During ${timeText}`);
        }

        // Location requirement
        if (evolutionDetails.location) {
            const locationName = this.formatLocationName(
                evolutionDetails.location.name
            );
            requirements.push(`At ${locationName}`);
        }

        // Known move requirement
        if (evolutionDetails.known_move) {
            const moveName = this.formatMoveName(
                evolutionDetails.known_move.name
            );
            requirements.push(`Knows ${moveName}`);
        }

        // Known move type requirement
        if (evolutionDetails.known_move_type) {
            const typeName = this.capitalizeFirst(
                evolutionDetails.known_move_type.name
            );
            requirements.push(`Knows ${typeName}-type move`);
        }

        // Held item requirement
        if (evolutionDetails.held_item) {
            const itemName = this.formatItemName(
                evolutionDetails.held_item.name
            );
            requirements.push(`Hold ${itemName}`);
        }

        // Gender requirement
        if (evolutionDetails.gender) {
            const genderText =
                evolutionDetails.gender === 1 ? "Female" : "Male";
            requirements.push(`${genderText} only`);
        }

        // Minimum beauty/affection/etc.
        if (evolutionDetails.min_beauty) {
            requirements.push(`Beauty ${evolutionDetails.min_beauty}+`);
        }
        if (evolutionDetails.min_affection) {
            requirements.push(`Affection ${evolutionDetails.min_affection}+`);
        }

        // Party requirements
        if (evolutionDetails.party_species) {
            const speciesName = this.formatPokemonName(
                evolutionDetails.party_species.name
            );
            requirements.push(`With ${speciesName} in party`);
        }
        if (evolutionDetails.party_type) {
            const typeName = this.capitalizeFirst(
                evolutionDetails.party_type.name
            );
            requirements.push(`With ${typeName}-type in party`);
        }

        // Trade requirement
        if (evolutionDetails.trade_species) {
            const speciesName = this.formatPokemonName(
                evolutionDetails.trade_species.name
            );
            requirements.push(`Trade for ${speciesName}`);
        }

        // Check for special move-based evolution requirements not covered by PokeAPI
        const specialMoveRequirements =
            this.getSpecialMoveEvolutionRequirements(
                evolutionDetails,
                currentPokemonName
            );
        if (specialMoveRequirements) {
            requirements.push(specialMoveRequirements);
        }

        // Trigger-specific requirements
        if (evolutionDetails.trigger) {
            const trigger = evolutionDetails.trigger.name;

            switch (trigger) {
                case "trade":
                    if (
                        !evolutionDetails.held_item &&
                        !evolutionDetails.trade_species
                    ) {
                        requirements.push("Trade");
                    }
                    break;
                case "level-up":
                    // Level-up trigger is implicit, only add if no other level requirement
                    if (
                        !evolutionDetails.min_level &&
                        requirements.length === 0
                    ) {
                        requirements.push("Level up");
                    }
                    break;
                case "use-item":
                    // Item usage is already handled above
                    break;
                case "shed":
                    requirements.push(
                        "Level up with empty party slot & Pokéball"
                    );
                    break;
            }
        }

        // Other special conditions
        if (evolutionDetails.needs_overworld_rain) {
            requirements.push("During rain");
        }
        if (evolutionDetails.turn_upside_down) {
            requirements.push("Turn console upside down");
        }
        if (evolutionDetails.relative_physical_stats) {
            const stat = evolutionDetails.relative_physical_stats;
            if (stat === 1) requirements.push("Attack > Defense");
            else if (stat === -1) requirements.push("Defense > Attack");
            else requirements.push("Attack = Defense");
        }

        // Filter by generation availability
        const filteredRequirements = this.filterEvolutionByGeneration(
            requirements,
            evolutionDetails
        );

        return filteredRequirements.join(", ");
    }

    async getAllPokemonForms(pokemonName) {
        try {
            // Handle special cases where the base form doesn't exist
            if (pokemonName === "wormadam") {
                return await this.getWormadamForms();
            }

            // Get the main Pokemon first
            const mainPokemon = await this.getPokemonData(pokemonName);
            if (!mainPokemon) {
                // If main form doesn't exist, try to handle special form-only Pokemon
                return await this.handleFormOnlyPokemon(pokemonName);
            }

            const forms = [mainPokemon];

            // Get species data to find all varieties
            const speciesData = await this.getPokemonSpecies(
                mainPokemon.species.url
            );
            if (speciesData && speciesData.varieties) {
                for (const variety of speciesData.varieties) {
                    // Skip the default variety as we already have it
                    if (variety.is_default) continue;

                    try {
                        const variantPokemon = await this.getPokemonData(
                            variety.pokemon.name
                        );
                        if (variantPokemon) {
                            forms.push(variantPokemon);
                        }
                    } catch (error) {
                        // Silent fail for unavailable varieties
                        console.debug(
                            `Variety ${variety.pokemon.name} not available:`,
                            error
                        );
                    }
                }
            }

            return forms;
        } catch (error) {
            console.error(`Error getting forms for ${pokemonName}:`, error);
            // Try to handle special form-only Pokemon as fallback
            const fallbackForms = await this.handleFormOnlyPokemon(pokemonName);
            return fallbackForms.length > 0 ? fallbackForms : [];
        }
    }

    async getWormadamForms() {
        const wormadamForms = [];
        const formNames = [
            "wormadam-plant",
            "wormadam-sandy",
            "wormadam-trash",
        ];

        for (const formName of formNames) {
            try {
                const formData = await this.getPokemonData(formName);
                if (formData) {
                    wormadamForms.push(formData);
                }
            } catch (error) {
                console.debug(`Could not fetch ${formName}:`, error);
            }
        }

        return wormadamForms;
    }

    async handleFormOnlyPokemon(pokemonName) {
        // Define Pokemon that only exist in specific forms (no base form)
        const formOnlyPokemon = {
            wormadam: ["wormadam-plant", "wormadam-sandy", "wormadam-trash"],
            // Add other form-only Pokemon here as needed
            // 'rotom': ['rotom-heat', 'rotom-wash', 'rotom-frost', 'rotom-fan', 'rotom-mow'],
            // 'shaymin': ['shaymin-land', 'shaymin-sky'],
            // etc.
        };

        if (formOnlyPokemon[pokemonName]) {
            const forms = [];
            for (const formName of formOnlyPokemon[pokemonName]) {
                try {
                    const formData = await this.getPokemonData(formName);
                    if (formData) {
                        forms.push(formData);
                    }
                } catch (error) {
                    console.debug(`Could not fetch ${formName}:`, error);
                }
            }
            return forms;
        }

        return [];
    }

    isRegionalForm(pokemonName) {
        return (
            pokemonName.includes("-alola") ||
            pokemonName.includes("-galar") ||
            pokemonName.includes("-hisui") ||
            pokemonName.includes("-paldea") ||
            pokemonName.endsWith("-alolan") ||
            pokemonName.endsWith("-galarian") ||
            pokemonName.endsWith("-hisuian") ||
            pokemonName.endsWith("-paldean")
        );
    }

    isMegaEvolution(pokemonName) {
        return pokemonName.includes("-mega");
    }

    isCurrentPokemonMatch(pokemonName, currentPokemonName) {
        // Exact match for the selected Pokemon
        return pokemonName === currentPokemonName.toLowerCase();
    }

    getRegionalType(pokemonName) {
        if (pokemonName.includes("-alola") || pokemonName.endsWith("-alolan")) {
            return "alola";
        } else if (
            pokemonName.includes("-galar") ||
            pokemonName.endsWith("-galarian")
        ) {
            return "galar";
        } else if (
            pokemonName.includes("-hisui") ||
            pokemonName.endsWith("-hisuian")
        ) {
            return "hisui";
        } else if (
            pokemonName.includes("-paldea") ||
            pokemonName.endsWith("-paldean")
        ) {
            return "paldea";
        }
        return null;
    }

    getRegionalFormRequirements(pokemonName) {
        if (pokemonName.includes("-alola") || pokemonName.endsWith("-alolan")) {
            return "Alolan Form";
        } else if (
            pokemonName.includes("-galar") ||
            pokemonName.endsWith("-galarian")
        ) {
            return "Galarian Form";
        } else if (
            pokemonName.includes("-hisui") ||
            pokemonName.endsWith("-hisuian")
        ) {
            return "Hisuian Form";
        } else if (
            pokemonName.includes("-paldea") ||
            pokemonName.endsWith("-paldean")
        ) {
            return "Paldean Form";
        }
        return "Regional Variant";
    }

    getMegaEvolutionRequirements(pokemonName) {
        const baseName = pokemonName
            .replace("-mega", "")
            .replace("-x", "")
            .replace("-y", "");

        if (pokemonName.includes("-mega-x")) {
            return `${this.formatPokemonName(baseName)}ite X`;
        } else if (pokemonName.includes("-mega-y")) {
            return `${this.formatPokemonName(baseName)}ite Y`;
        } else if (pokemonName.includes("-mega")) {
            return `${this.formatPokemonName(baseName)}ite`;
        }
        return "Mega Stone";
    }

    formatMegaEvolutionName(pokemonName) {
        const baseName = pokemonName
            .replace("-mega", "")
            .replace("-x", "")
            .replace("-y", "");
        const formattedBaseName = this.formatPokemonName(baseName);

        if (pokemonName.includes("-mega-x")) {
            return `Mega ${formattedBaseName} X`;
        } else if (pokemonName.includes("-mega-y")) {
            return `Mega ${formattedBaseName} Y`;
        } else if (pokemonName.includes("-mega")) {
            return `Mega ${formattedBaseName}`;
        }
        return this.formatPokemonName(pokemonName);
    }

    formatItemName(itemName) {
        return itemName
            .split("-")
            .map((word) => this.capitalizeFirst(word))
            .join(" ");
    }

    formatLocationName(locationName) {
        return locationName
            .split("-")
            .map((word) => this.capitalizeFirst(word))
            .join(" ");
    }

    formatMoveName(moveName) {
        return moveName
            .split("-")
            .map((word) => this.capitalizeFirst(word))
            .join(" ");
    }

    getEvolutionRequirementsForEvolution(parentNode, evolutionNode) {
        // Get the evolution details for this specific evolution
        // We need to find the evolution details that correspond to this evolution
        if (!parentNode.chainData || !parentNode.chainData.evolves_to) {
            return "";
        }

        // Find the evolution details for this specific evolution
        const evolutionDetails = parentNode.chainData.evolves_to.find(
            (evo) => evo.species.name === evolutionNode.name
        );

        if (!evolutionDetails) {
            return "";
        }

        // Get the appropriate evolution details for the current generation
        const selectedDetails = this.selectEvolutionDetailsForGeneration(
            evolutionDetails.evolution_details
        );

        // Get the requirements using the parent Pokemon's name (the one that evolves)
        return this.getEvolutionRequirements(selectedDetails, parentNode.name);
    }

    getSpecialMoveEvolutionRequirements(evolutionDetails, currentPokemonName) {
        // Handle special move-based evolution requirements not covered by PokeAPI
        // These are hardcoded for known cases where PokeAPI data is incomplete

        // Annihilape evolution from Primeape
        if (
            currentPokemonName === "primeape" &&
            evolutionDetails?.trigger?.name === "other"
        ) {
            return "Use Rage Fist 20 times, then level up";
        }

        // Gholdengo evolution from Gimmighoul
        if (
            currentPokemonName === "gimmighoul" &&
            evolutionDetails?.trigger?.name === "other"
        ) {
            return "Collect 999 Gimmighoul Coins, then level up";
        }

        // Add more special cases as needed
        // Example: Other move-based evolutions that PokeAPI doesn't properly document

        return null;
    }

    filterEvolutionByGeneration(requirements, evolutionDetails) {
        // Handle generation-specific evolution requirements
        if (!evolutionDetails) return requirements;

        // Special handling for location-based evolutions that changed between generations
        if (evolutionDetails.location) {
            const locationName = evolutionDetails.location.name;
            const adjustedRequirements = this.adjustLocationForGeneration(
                locationName,
                requirements
            );
            return adjustedRequirements;
        }

        // Filter out evolution methods not available in current generation
        const generationIntroductions = {
            friendship: 2, // Friendship introduced in Gen II
            "time-of-day": 2, // Day/Night cycle introduced in Gen II
            "held-item-trade": 2, // Held items introduced in Gen II
            beauty: 3, // Contests/Beauty introduced in Gen III
            "trade-for-species": 1, // Always available
            "location-specific": 4, // Many location evolutions introduced in Gen IV
            affection: 6, // Affection introduced in Gen VI (Pokemon-Amie)
            "overworld-rain": 3, // Weather introduced in Gen III
            "physical-stats": 4, // Physical/Special split in Gen IV made this relevant
        };

        return requirements.filter((req) => {
            // Check if requirement is available in current generation
            if (req.includes("Affection") && this.currentGeneration < 6)
                return false;
            if (req.includes("Beauty") && this.currentGeneration < 3)
                return false;
            if (req.includes("Friendship") && this.currentGeneration < 2)
                return false;
            if (req.includes("During") && this.currentGeneration < 2)
                return false; // Time of day
            return true;
        });
    }

    adjustLocationForGeneration(locationName, requirements) {
        // Handle generation-specific location changes and convert to general conditions
        const locationMappings = {
            // Magnetic field locations by generation
            "mt-coronet": {
                generations: [4], // Gen IV only
                condition: "Special magnetic field",
                alternativeGenerations: {
                    5: "Special magnetic field", // Chargestone Cave in Gen V
                    6: "Special magnetic field",
                    7: "Special magnetic field",
                    8: "Use Thunder Stone", // Gen VIII changed to Thunder Stone
                    9: "Use Thunder Stone",
                },
            },
            "chargestone-cave": {
                generations: [5], // Gen V only
                condition: "Special magnetic field",
            },
            // Moss Rock locations - Leafeon
            "eterna-forest": {
                generations: [4], // Gen IV
                condition: "Near Moss Rock",
                alternativeGenerations: {
                    5: "Near Moss Rock", // Pinwheel Forest in Gen V
                    6: "Near Moss Rock", // Route 20 in Gen VI
                    7: "Near Moss Rock", // Lush Jungle in Gen VII
                    8: "Use Leaf Stone",
                    9: "Use Leaf Stone",
                },
            },
            "pinwheel-forest": {
                generations: [5], // Gen V
                condition: "Near Moss Rock",
            },
            "route-20": {
                generations: [6], // Gen VI
                condition: "Near Moss Rock",
            },
            "lush-jungle": {
                generations: [7], // Gen VII
                condition: "Near Moss Rock",
            },
            // Ice Rock locations - Glaceon
            "route-217": {
                generations: [4], // Gen IV
                condition: "Near Ice Rock",
                alternativeGenerations: {
                    5: "Near Ice Rock", // Twist Mountain in Gen V
                    6: "Near Ice Rock", // Frost Cavern in Gen VI
                    7: "Near Ice Rock", // Mount Lanakila in Gen VII
                    8: "Use Ice Stone",
                    9: "Use Ice Stone",
                },
            },
            "twist-mountain": {
                generations: [5], // Gen V
                condition: "Near Ice Rock",
            },
            "frost-cavern": {
                generations: [6], // Gen VI
                condition: "Near Ice Rock",
            },
            "mount-lanakila": {
                generations: [7], // Gen VII
                condition: "Near Ice Rock",
            },
        };

        const mapping = locationMappings[locationName];
        if (!mapping) {
            // If no special mapping, use the location name as-is
            return requirements;
        }

        // Check if this location is valid for current generation
        if (mapping.generations.includes(this.currentGeneration)) {
            // Replace location requirement with general condition
            return requirements.map((req) => {
                if (req.includes("At ")) {
                    return req.replace(/At .+/, mapping.condition);
                }
                return req;
            });
        }

        // Check for alternative evolution method in current generation
        if (
            mapping.alternativeGenerations &&
            mapping.alternativeGenerations[this.currentGeneration]
        ) {
            const alternative =
                mapping.alternativeGenerations[this.currentGeneration];

            return requirements.map((req) => {
                if (req.includes("At ")) {
                    // Check if alternative is an item (Use X) or location
                    if (alternative.startsWith("Use ")) {
                        return alternative;
                    } else {
                        return mapping.condition; // Use general condition
                    }
                }
                return req;
            });
        }

        // If no alternative found, use general condition
        return requirements.map((req) => {
            if (req.includes("At ")) {
                return mapping.condition;
            }
            return req;
        });
    }

    async displayAbilities(pokemonData) {
        const container = document.getElementById("abilities-list");
        container.innerHTML = "";

        for (const abilityData of pokemonData.abilities) {
            try {
                const abilityResponse = await fetch(abilityData.ability.url);
                const ability = await abilityResponse.json();

                const abilityItem = document.createElement("div");
                abilityItem.className = "ability-item";
                abilityItem.onclick = () =>
                    this.openBulbapediaAbility(ability.name);

                const description =
                    ability.effect_entries.find(
                        (entry) => entry.language.name === "en"
                    )?.effect ||
                    ability.flavor_text_entries.find(
                        (entry) => entry.language.name === "en"
                    )?.flavor_text ||
                    "No description available";

                abilityItem.innerHTML = `
                    <div class="ability-name">
                        ${ability.name}
                        ${
                            abilityData.is_hidden
                                ? '<span class="ability-hidden">Hidden</span>'
                                : ""
                        }
                    </div>
                    <div class="ability-description">${description}</div>
                `;

                container.appendChild(abilityItem);
            } catch (error) {
                console.error(
                    `Error loading ability ${abilityData.ability.name}:`,
                    error
                );
            }
        }
    }

    displayStats(pokemonData) {
        const container = document.getElementById("stats-display");
        const primaryType = pokemonData.types[0].type.name;

        // Set background gradient based on type(s)
        if (pokemonData.types.length === 2) {
            // Dual-type: gradient between both type colors
            const secondaryType = pokemonData.types[1].type.name;
            container.style.background = `linear-gradient(135deg, var(--type-${primaryType}), var(--type-${secondaryType}))`;
            container.style.border = `2px solid var(--type-${primaryType})`;
        } else {
            // Single-type: gradient to background color (existing behavior)
            container.style.background = `linear-gradient(135deg, var(--type-${primaryType}), var(--background-color))`;
            container.style.border = `2px solid var(--type-${primaryType})`;
        }

        const statNames = {
            hp: "HP",
            attack: "Attack",
            defense: "Defense",
            "special-attack": "Sp. Atk",
            "special-defense": "Sp. Def",
            speed: "Speed",
        };

        let html = "";
        let total = 0;

        pokemonData.stats.forEach((stat) => {
            const statName = stat.stat.name;
            const baseStat = stat.base_stat;
            total += baseStat;

            html += `
                <div class="stats-item">
                    <div class="stat-name">${
                        statNames[statName] || statName
                    }</div>
                    <div class="stat-value">${baseStat}</div>
                </div>
            `;
        });

        html += `
            <div class="stats-item total-stat">
                <div class="stat-name">Total</div>
                <div class="stat-value">${total}</div>
            </div>
        `;

        container.innerHTML = html;
    }

    calculateMinStat(baseStat, statName) {
        if (statName === "hp") {
            return baseStat === 1
                ? 1
                : Math.round((2 * baseStat * 50) / 100) + 50 + 10;
        }
        return Math.round((2 * baseStat * 50) / 100 + 5) * 0.9;
    }

    calculateMaxStat(baseStat, statName) {
        if (statName === "hp") {
            return baseStat === 1
                ? 1
                : Math.round(((2 * baseStat + 31 + 252 / 4) * 100) / 100) +
                      100 +
                      10;
        }
        return (
            Math.round(((2 * baseStat + 31 + 252 / 4) * 100) / 100 + 5) * 1.1
        );
    }

    displayTypeEffectiveness(pokemonData) {
        const container = document.getElementById("type-effectiveness");
        const allTypes = this.getGenerationTypes();

        // Add subtitle
        const section = container.closest(".type-effectiveness-section");
        let subtitle = section.querySelector(
            "#defense-effectiveness .type-effectiveness-subtitle"
        );
        if (!subtitle) {
            subtitle = document.createElement("div");
            subtitle.className = "type-effectiveness-subtitle";
            const defenseContent = section.querySelector(
                "#defense-effectiveness"
            );
            defenseContent.insertBefore(subtitle, container);
        }
        subtitle.textContent = `Under normal conditions in Generation ${this.toRoman(
            this.currentGeneration
        )}, this Pokemon will take modified damage from the following types:`;

        // Calculate defensive effectiveness and group by multiplier
        const effectiveness = {};
        const groups = {
            immune: [], // 0x
            resistant: [], // less than 1x (0.25x, 0.5x)
            normal: [], // 1x
            weak: [], // greater than 1x (2x, 4x)
        };

        allTypes.forEach((attackingType) => {
            let multiplier = 1;

            pokemonData.types.forEach((defendingType) => {
                const typeEffectiveness = this.getTypeEffectiveness(
                    attackingType,
                    defendingType.type.name
                );
                multiplier *= typeEffectiveness;
            });

            effectiveness[attackingType] = multiplier;

            // Group types by their effectiveness
            if (multiplier === 0) {
                groups.immune.push({
                    type: attackingType,
                    multiplier,
                    text: "0×",
                    class: "immune",
                });
            } else if (multiplier < 1) {
                const text = multiplier === 0.25 ? "¼×" : "½×";
                const className = multiplier === 0.25 ? "quarter" : "half";
                groups.resistant.push({
                    type: attackingType,
                    multiplier,
                    text,
                    class: className,
                });
            } else if (multiplier === 1) {
                groups.normal.push({
                    type: attackingType,
                    multiplier,
                    text: "1×",
                    class: "normal",
                });
            } else {
                const text = multiplier === 4 ? "4×" : "2×";
                const className = multiplier === 4 ? "quadruple" : "double";
                groups.weak.push({
                    type: attackingType,
                    multiplier,
                    text,
                    class: className,
                });
            }
        });

        let html = "";

        // Display groups in order: weak, normal, resistant, immune
        const groupOrder = ["weak", "normal", "resistant", "immune"];
        const groupTitles = {
            weak: "Weak To (Takes more damage)",
            normal: "Normal Effectiveness",
            resistant: "Resistant To (Takes less damage)",
            immune: "Immune To (Takes no damage)",
        };

        groupOrder.forEach((groupName) => {
            const group = groups[groupName];
            if (group.length > 0) {
                html += `<div class="effectiveness-group">
                    <h4 class="effectiveness-group-title">${groupTitles[groupName]}</h4>
                    <div class="effectiveness-group-items">`;

                group.forEach((item) => {
                    html += `
                        <div class="effectiveness-item">
                            <div class="effectiveness-type ${item.type}">${item.type}</div>
                            <div class="effectiveness-multiplier ${item.class}" style="padding: 0.75rem;">${item.text}</div>
                        </div>
                    `;
                });

                html += `</div></div>`;
            }
        });

        container.innerHTML = html;
    }

    displayOffensiveTypeEffectiveness(pokemonData) {
        const container = document.getElementById("offense-type-effectiveness");
        const allTypes = this.getGenerationTypes();

        // Add subtitle
        const section = container.closest(".type-effectiveness-section");
        let subtitle = section.querySelector(
            "#offense-effectiveness .type-effectiveness-subtitle"
        );
        if (!subtitle) {
            subtitle = document.createElement("div");
            subtitle.className = "type-effectiveness-subtitle";
            const offenseContent = section.querySelector(
                "#offense-effectiveness"
            );
            offenseContent.insertBefore(subtitle, container);
        }
        subtitle.textContent = `Under normal conditions in Generation ${this.toRoman(
            this.currentGeneration
        )}, this Pokemon's types will deal modified damage to the following types:`;

        let html = "";

        // Generate a section for each of the Pokemon's types
        pokemonData.types.forEach((pokemonType, index) => {
            const typeName = pokemonType.type.name;

            // Calculate offensive effectiveness for this type against all other types
            const groups = {
                superEffective: [], // 2x or 4x (though single type can only do 2x max)
                normal: [], // 1x
                notVeryEffective: [], // 0.5x or 0.25x (though single type can only do 0.5x max)
                noEffect: [], // 0x
            };

            allTypes.forEach((defendingType) => {
                const effectiveness = this.getTypeEffectiveness(
                    typeName,
                    defendingType
                );

                if (effectiveness === 0) {
                    groups.noEffect.push({
                        type: defendingType,
                        multiplier: effectiveness,
                        text: "0×",
                        class: "immune",
                    });
                } else if (effectiveness > 1) {
                    groups.superEffective.push({
                        type: defendingType,
                        multiplier: effectiveness,
                        text: "2×",
                        class: "double",
                    });
                } else if (effectiveness < 1) {
                    groups.notVeryEffective.push({
                        type: defendingType,
                        multiplier: effectiveness,
                        text: "½×",
                        class: "half",
                    });
                } else {
                    groups.normal.push({
                        type: defendingType,
                        multiplier: effectiveness,
                        text: "1×",
                        class: "normal",
                    });
                }
            });

            // Create a section for this type
            html += `<div class="offense-type-section offense-type-${typeName}">
                <h3 class="offense-type-title">
                    <span class="type-badge ${typeName}">${
                typeName.charAt(0).toUpperCase() + typeName.slice(1)
            } Type Attacks</span>
                </h3>
                <div class="offense-type-groups">`;

            // Display groups in order: super effective, normal, not very effective, no effect
            const groupOrder = [
                "superEffective",
                "normal",
                "notVeryEffective",
                "noEffect",
            ];
            const groupTitles = {
                superEffective: "Super Effective Against (Deals 2× damage)",
                normal: "Normal Effectiveness (Deals 1× damage)",
                notVeryEffective:
                    "Not Very Effective Against (Deals ½× damage)",
                noEffect: "No Effect Against (Deals 0× damage)",
            };

            groupOrder.forEach((groupName) => {
                const group = groups[groupName];
                if (group.length > 0) {
                    html += `<div class="effectiveness-group">
                        <h4 class="effectiveness-group-title">${groupTitles[groupName]}</h4>
                        <div class="effectiveness-group-items">`;

                    group.forEach((item) => {
                        html += `
                            <div class="effectiveness-item">
                                <div class="effectiveness-type ${item.type}">${item.type}</div>
                                <div class="effectiveness-multiplier ${item.class}" style="padding: 0.75rem;">${item.text}</div>
                            </div>
                        `;
                    });

                    html += `</div></div>`;
                }
            });

            html += `</div></div>`;
        });

        container.innerHTML = html;
    }

    async displayMoves(pokemonData) {
        try {
            const levelUpMovesMap = new Map();
            const tmHmMovesMap = new Map();

            // First, collect all unique move URLs that we need to fetch
            const moveUrlsToFetch = new Set();
            const moveVersionDetails = new Map(); // Map move URL to version details

            for (const moveData of pokemonData.moves) {
                const versionGroupDetails =
                    moveData.version_group_details.filter((detail) =>
                        this.isVersionGroupInGeneration(
                            detail.version_group.name,
                            this.currentGeneration
                        )
                    );

                if (versionGroupDetails.length === 0) continue;

                const moveUrl = moveData.move.url;
                moveUrlsToFetch.add(moveUrl);
                
                // Store version details for this move
                if (!moveVersionDetails.has(moveUrl)) {
                    moveVersionDetails.set(moveUrl, []);
                }
                moveVersionDetails.get(moveUrl).push(...versionGroupDetails);
            }

            // Batch fetch all moves in parallel (with caching)
            const moveFetchPromises = Array.from(moveUrlsToFetch).map(async (moveUrl) => {
                // Check cache first
                if (this.moveCache.has(moveUrl)) {
                    return this.moveCache.get(moveUrl);
                }

                try {
                    const moveResponse = await fetch(moveUrl);
                    if (!moveResponse.ok) {
                        console.warn(`Failed to fetch move: ${moveUrl}`);
                        return null;
                    }
                    const move = await moveResponse.json();
                    this.moveCache.set(moveUrl, move);
                    return move;
                } catch (error) {
                    console.warn(`Error fetching move ${moveUrl}:`, error);
                    return null;
                }
            });

            const moves = await Promise.all(moveFetchPromises);

            // Process moves and their version details
            moves.forEach((move, index) => {
                if (!move) return;
                
                const moveUrl = Array.from(moveUrlsToFetch)[index];
                const versionDetails = moveVersionDetails.get(moveUrl) || [];

                versionDetails.forEach((detail) => {
                    // Get move effect description
                    const effectEntry = move.effect_entries?.find(
                        (entry) => entry.language.name === "en"
                    );
                    const flavorEntry = move.flavor_text_entries?.find(
                        (entry) => entry.language.name === "en"
                    );
                    const effect =
                        effectEntry?.short_effect ||
                        effectEntry?.effect ||
                        flavorEntry?.flavor_text ||
                        "No effect description available";

                    const moveInfo = {
                        name: move.name,
                        type: move.type?.name || "normal",
                        power: move.power || "—",
                        accuracy: move.accuracy || "—",
                        pp: move.pp || "—",
                        category: move.damage_class?.name || "status",
                        effect: effect,
                        level: detail.level_learned_at,
                        method: detail.move_learn_method.name,
                    };

                    if (detail.move_learn_method.name === "level-up") {
                        // Use the lowest level for duplicate moves
                        if (
                            !levelUpMovesMap.has(move.name) ||
                            levelUpMovesMap.get(move.name).level >
                                moveInfo.level
                        ) {
                            levelUpMovesMap.set(move.name, moveInfo);
                        }
                    } else if (detail.move_learn_method.name === "machine") {
                        // Only add unique TM/HM moves
                        if (!tmHmMovesMap.has(move.name)) {
                            tmHmMovesMap.set(move.name, moveInfo);
                        }
                    }
                });
            });

            // Convert maps to arrays and sort
            const levelUpMoves = Array.from(levelUpMovesMap.values()).sort(
                (a, b) => a.level - b.level
            );
            const tmHmMoves = this.sortTmHmMoves(
                Array.from(tmHmMovesMap.values())
            );

            this.displayMoveList("level-up-moves", levelUpMoves, "level");
            this.displayMoveList("tm-hm-moves", tmHmMoves, "tm");
        } catch (error) {
            console.error("Error displaying moves:", error);
        }
    }

    sortTmHmMoves(moves) {
        // Define type order - common attacking types first, then others alphabetically
        const typeOrder = [
            "normal",
            "fire",
            "water",
            "electric",
            "grass",
            "ice",
            "fighting",
            "poison",
            "ground",
            "flying",
            "psychic",
            "bug",
            "rock",
            "ghost",
            "dragon",
            "dark",
            "steel",
            "fairy",
        ];

        return moves.sort((a, b) => {
            // First sort by category: status moves come last
            const aIsStatus = a.damageClass === "status";
            const bIsStatus = b.damageClass === "status";

            if (aIsStatus !== bIsStatus) {
                return aIsStatus ? 1 : -1; // Status moves go to the end
            }

            // Then sort by type
            const aTypeIndex = typeOrder.indexOf(a.type);
            const bTypeIndex = typeOrder.indexOf(b.type);

            if (aTypeIndex !== bTypeIndex) {
                return aTypeIndex - bTypeIndex;
            }

            // For moves of the same type and category, sort by power
            if (!aIsStatus) {
                // For attacking moves, sort by power (lowest to highest)
                const aPower = a.power || 0;
                const bPower = b.power || 0;

                if (aPower !== bPower) {
                    return aPower - bPower;
                }
            }

            // Finally, sort alphabetically by name
            return a.name.localeCompare(b.name);
        });
    }

    formatMoveNameForBulbapedia(moveName) {
        // Convert move name to proper format for Bulbapedia URLs
        // Replace spaces with underscores and handle special characters
        return moveName
            .split("-")
            .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
            .join("_")
            .replace(/\s+/g, "_");
    }

    displayMoveList(containerId, moves, type) {
        const container = document.getElementById(containerId);

        if (moves.length === 0) {
            container.innerHTML =
                '<p class="no-moves">No moves available for this generation</p>';
            return;
        }

        let html = "";

        moves.forEach((move) => {
            const bulbapediaUrl = `https://bulbapedia.bulbagarden.net/wiki/${this.formatMoveNameForBulbapedia(
                move.name
            )}_(move)`;
            const displayName = move.name
                .split("-")
                .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
                .join(" ");

            // Truncate effect text if too long
            const maxEffectLength = 120;
            let effectText = move.effect || "No effect description available";
            if (effectText.length > maxEffectLength) {
                effectText = effectText.substring(0, maxEffectLength) + "...";
            }

            // Get move category and style
            const categoryClass = `move-category-${move.category}`;
            const categoryText =
                move.category === "physical"
                    ? "Physical"
                    : move.category === "special"
                    ? "Special"
                    : "Status";

            html += `
                <a href="${bulbapediaUrl}" target="_blank" rel="noopener noreferrer" class="move-item move-card">
                    <div class="move-header">
                        <div class="move-name-type">
                            <span class="move-name">${displayName}</span>
                            <span class="type-badge type-${move.type}">${
                move.type
            }</span>
                            <span class="move-category ${categoryClass}">${categoryText}</span>
                            <span class="move-pp">PP: ${move.pp}</span>
                            <div class="move-${type}">
                                ${
                                    type === "level"
                                        ? `Lv. ${move.level}`
                                        : "TM/HM"
                                }
                            </div>
                        </div>
                        <div class="move-meta">
                            
                        </div>
                    </div>
                    <div class="move-stats">
                        <span class="stat-item">Power: ${move.power}</span>
                        <span class="stat-item">Accuracy: ${
                            move.accuracy
                        }</span>
                    </div>
                    <div class="move-effect">${effectText}</div>
                </a>
            `;
        });

        container.innerHTML = html;
    }

    async displayLocations(pokemonData) {
        try {
            let locationResponse = await fetch(
                `https://pokeapi.co/api/v2/pokemon/${pokemonData.id}/encounters`
            );
            let locations = await locationResponse.json();

            // If no data found with ID, try with name
            if (locations.length === 0) {
                locationResponse = await fetch(
                    `https://pokeapi.co/api/v2/pokemon/${pokemonData.name}/encounters`
                );
                locations = await locationResponse.json();
            }

            const container = document.getElementById("location-display");

            if (locations.length === 0) {
                // Show no encounters message with Bulbapedia link
                await this.displayNoEncounters(container, pokemonData.name);
                return;
            }

            // Group locations by game version with detailed encounter info
            const gameGroups = {};
            const locationAreaCache = new Map(); // Cache location area data to avoid duplicate fetches

            for (const location of locations) {
                // Filter by generation first to avoid unnecessary API calls
                const locationDetails = location.version_details.filter(
                    (detail) =>
                        this.isVersionInGeneration(
                            detail.version.name,
                            this.currentGeneration
                        )
                );

                // Skip if no versions match current generation
                if (locationDetails.length === 0) {
                    continue;
                }

                // Get detailed location area data (use cache to avoid duplicate fetches)
                let locationAreaData;
                if (locationAreaCache.has(location.location_area.url)) {
                    locationAreaData = locationAreaCache.get(location.location_area.url);
                } else {
                    locationAreaData = await this.getLocationAreaData(
                        location.location_area.url
                    );
                    if (locationAreaData) {
                        locationAreaCache.set(location.location_area.url, locationAreaData);
                    }
                }

                for (const detail of locationDetails) {
                    const gameName = this.formatGameName(detail.version.name);

                    if (!gameGroups[gameName]) {
                        gameGroups[gameName] = new Map();
                    }

                    const locationKey = location.location_area.name;

                    if (!gameGroups[gameName].has(locationKey)) {
                        gameGroups[gameName].set(locationKey, {
                            locationName: location.location_area.name.replace(
                                /-/g,
                                " "
                            ),
                            locationAreaData: locationAreaData,
                            encounters: new Map(),
                            maxChance: detail.max_chance,
                        });
                    }

                    // Process encounter details with conditions
                    detail.encounter_details.forEach((encounter) => {
                        const methodName = encounter.method?.name || "walk";
                        const conditions =
                            encounter.condition_values?.map((cv) => cv.name) ||
                            [];
                        const encounterKey = `${methodName}-${conditions
                            .sort()
                            .join("-")}`;

                        if (
                            !gameGroups[gameName]
                                .get(locationKey)
                                .encounters.has(encounterKey)
                        ) {
                            gameGroups[gameName]
                                .get(locationKey)
                                .encounters.set(encounterKey, {
                                    method: methodName,
                                    conditions: conditions,
                                    chance: encounter.chance || 0,
                                    minLevel: encounter.min_level || 0,
                                    maxLevel: encounter.max_level || 0,
                                });
                        }
                    });
                }
            }

            if (Object.keys(gameGroups).length === 0) {
                await this.displayNoEncounters(container, pokemonData.name);
                return;
            }

            let html = "";

            // Sort games in a logical order for each generation
            const gameOrder = this.getGameOrderForGeneration(
                this.currentGeneration
            );
            const sortedGames = Object.keys(gameGroups).sort((a, b) => {
                const indexA = gameOrder.indexOf(a);
                const indexB = gameOrder.indexOf(b);
                return (
                    (indexA === -1 ? 999 : indexA) -
                    (indexB === -1 ? 999 : indexB)
                );
            });

            sortedGames.forEach((gameName) => {
                const locationMap = gameGroups[gameName];

                html += `
                    <div class="game-group">
                        <h4 class="game-title">${gameName}</h4>
                        <div class="game-locations">
                `;

                // Sort locations by lowest minimum level
                const sortedLocations = Array.from(locationMap.values()).sort(
                    (a, b) => {
                        const aMinLevel = Math.min(
                            ...Array.from(a.encounters.values()).map(
                                (e) => e.minLevel || 999
                            )
                        );
                        const bMinLevel = Math.min(
                            ...Array.from(b.encounters.values()).map(
                                (e) => e.minLevel || 999
                            )
                        );
                        return aMinLevel - bMinLevel;
                    }
                );

                sortedLocations.forEach((location) => {
                    html += `
                        <div class="location-item">
                            <div class="location-name">${this.capitalizeWords(
                                location.locationName
                            )}</div>
                            <div class="location-details">
                `;

                    // Sort encounters by minimum level within the location
                    const sortedEncounters = Array.from(
                        location.encounters.values()
                    ).sort((a, b) => {
                        return (a.minLevel || 999) - (b.minLevel || 999);
                    });

                    // Display unique encounters
                    sortedEncounters.forEach((encounter) => {
                        const methodInfo = this.formatEncounterMethod(
                            encounter.method,
                            encounter.conditions,
                            location.locationAreaData
                        );
                        html += `<span class="location-method">${methodInfo}</span>`;

                        if (encounter.chance > 0) {
                            html += `<span class="location-chance">${encounter.chance}%</span>`;
                        }

                        if (encounter.minLevel > 0 && encounter.maxLevel > 0) {
                            const levelRange =
                                encounter.minLevel === encounter.maxLevel
                                    ? `Lv.${encounter.minLevel}`
                                    : `Lv.${encounter.minLevel}-${encounter.maxLevel}`;
                            html += `<span class="location-level">${levelRange}</span>`;
                        }
                    });

                    html += `
                            </div>
                        </div>
                    `;
                });

                html += `
                        </div>
                    </div>
                `;
            });

            container.innerHTML = html;
        } catch (error) {
            console.error("Error displaying locations:", error);
            const container = document.getElementById("location-display");
            container.innerHTML =
                '<div class="no-location">Error loading location data</div>';
        }
    }

    // Removed Bulbapedia API methods due to CORS issues
    // getBulbapediaLocationData method removed

    // fetchBulbapediaPage method removed due to CORS issues

    parseBulbapediaLocationData(pageContent, generation) {
        try {
            // Find the Game locations section
            const gameLocationsMatch = pageContent.match(
                /==.*?Game locations.*?==([\s\S]*?)(?===|\{\{-\}\}|$)/i
            );

            if (!gameLocationsMatch) {
                // No Game locations section found
                return null;
            }

            const locationsSection = gameLocationsMatch[1];
            console.log(
                "Found Game locations section, length:",
                locationsSection.length
            );

            // Get generation-specific data
            const generationResult = this.extractGenerationSpecificData(
                locationsSection,
                generation
            );

            if (!generationResult) {
                // No Generation content found
                return null;
            }

            const {
                content: generationData,
                gameNames,
                genInfo,
            } = generationResult;

            // Parse different types of location data
            const locationData = [];

            // Parse encounter tables
            const tableData = this.parseEncounterTables(
                generationData,
                generation
            );
            if (tableData.length > 0) {
                locationData.push(...tableData);
            }

            // Parse location lists with better extraction
            const listData = this.parseLocationLists(generationData);
            if (listData.length > 0) {
                locationData.push(...listData);
            }

            // Parse inline location mentions (like "Routes 1 and 4")
            const inlineData = this.parseInlineLocations(generationData);
            if (inlineData.length > 0) {
                locationData.push(...inlineData);
            }

            // Remove duplicates and clean up
            const uniqueLocations = this.deduplicateLocations(locationData);

            // Parsed location data
            return {
                locations: uniqueLocations,
                gameNames: gameNames,
                genInfo: genInfo,
            };
        } catch (error) {
            console.error("Error parsing Bulbapedia content:", error);
            return null;
        }
    }

    parseInlineLocations(content) {
        const locations = [];

        try {
            // Enhanced route parsing - look for various route patterns
            this.parseRoutePatterns(content, locations);

            // Look for specific location mentions in descriptive text
            const locationPattern = /(?:in|at|on)\s+\[\[([^\]]+)\]\]/gi;
            let match;
            while ((match = locationPattern.exec(content)) !== null) {
                const locationName = match[1].split("|")[0];
                if (this.isLocationName(locationName)) {
                    locations.push({
                        name: this.cleanLocationName(locationName),
                        method: "Walking",
                        note: "Location mentioned in description",
                    });
                }
            }

            // Look for comma-separated location lists
            const listPattern =
                /\[\[([^\]]+)\]\],?\s*(?:and\s+)?\[\[([^\]]+)\]\]/g;
            while ((match = listPattern.exec(content)) !== null) {
                for (let i = 1; i < match.length; i++) {
                    if (match[i]) {
                        const locationName = match[i].split("|")[0];
                        if (this.isLocationName(locationName)) {
                            locations.push({
                                name: this.cleanLocationName(locationName),
                                method: "Walking",
                                note: "Location from list",
                            });
                        }
                    }
                }
            }
        } catch (error) {
            console.error("Error parsing inline locations:", error);
        }

        return locations;
    }

    parseRoutePatterns(content, locations) {
        // Parsing route patterns from content

        // Pattern 1: "Routes 1 and 4" or "Routes 1, 4"
        const routesPattern1 =
            /Routes?\s+([0-9]+(?:\s*(?:,\s*)?(?:and\s+)?[0-9]+)*)/gi;
        let match;
        while ((match = routesPattern1.exec(content)) !== null) {
            // Found route pattern
            const numbersText = match[1];
            const numbers = numbersText.match(/\d+/g);
            if (numbers) {
                // Extracted route numbers
                for (const num of numbers) {
                    locations.push({
                        name: `Route ${num}`,
                        method: "Walking",
                        note: "Route from pattern match",
                    });
                }
            }
        }

        // Pattern 2: "Route 1, Route 4" (separate route mentions)
        const routesPattern2 = /Route\s+(\d+)/gi;
        const routeMatches = [];
        while ((match = routesPattern2.exec(content)) !== null) {
            // Found individual route
            routeMatches.push(match[1]);
        }

        if (routeMatches.length > 0) {
            // All individual routes found
            // Remove duplicates
            const uniqueRoutes = [...new Set(routeMatches)];
            for (const num of uniqueRoutes) {
                locations.push({
                    name: `Route ${num}`,
                    method: "Walking",
                    note: "Individual route mention",
                });
            }
        }

        // Pattern 3: In wikitext links like "[[Route 1]]"
        const routeLinkPattern = /\[\[Route\s+(\d+)[^\]]*\]\]/gi;
        while ((match = routeLinkPattern.exec(content)) !== null) {
            // Found route link
            locations.push({
                name: `Route ${match[1]}`,
                method: "Walking",
                note: "Route from wiki link",
            });
        }

        // Pattern 4: Descriptive text like "on Routes 1 and 4" in larger sentences
        const descriptivePattern =
            /(?:on|in|at|from)\s+Routes?\s+([0-9]+(?:\s*(?:,\s*)?(?:and\s+)?[0-9]+)*)/gi;
        while ((match = descriptivePattern.exec(content)) !== null) {
            // Found descriptive route pattern
            const numbersText = match[1];
            const numbers = numbersText.match(/\d+/g);
            if (numbers) {
                // Extracted route numbers from description
                for (const num of numbers) {
                    locations.push({
                        name: `Route ${num}`,
                        method: "Walking",
                        note: "Route from description",
                    });
                }
            }
        }

        console.log(
            "Route parsing complete, found locations:",
            locations.filter((l) => l.name.includes("Route"))
        );
    }

    deduplicateLocations(locations) {
        const locationMap = new Map();

        for (const location of locations) {
            const key = location.name; // Only use name as key

            if (locationMap.has(key)) {
                // If we already have this location, merge the information
                const existing = locationMap.get(key);

                // Prefer more specific methods over generic ones
                const methodPriority = {
                    Walking: 3,
                    Surfing: 3,
                    Fishing: 3,
                    "Max Raid": 2,
                    Static: 3,
                    "See Bulbapedia for details": 1,
                };

                const currentPriority = methodPriority[location.method] || 1;
                const existingPriority = methodPriority[existing.method] || 1;

                // Keep the one with higher priority method, or merge data
                if (currentPriority > existingPriority) {
                    locationMap.set(key, {
                        ...existing,
                        method: location.method,
                        // Keep any additional data from the better source
                        ...(location.chance && { chance: location.chance }),
                        ...(location.minLevel && {
                            minLevel: location.minLevel,
                        }),
                        ...(location.maxLevel && {
                            maxLevel: location.maxLevel,
                        }),
                    });
                } else if (currentPriority === existingPriority) {
                    // Same priority, merge data
                    locationMap.set(key, {
                        ...existing,
                        // Add any missing data from the current location
                        ...(location.chance &&
                            !existing.chance && { chance: location.chance }),
                        ...(location.minLevel &&
                            !existing.minLevel && {
                                minLevel: location.minLevel,
                            }),
                        ...(location.maxLevel &&
                            !existing.maxLevel && {
                                maxLevel: location.maxLevel,
                            }),
                        // Combine notes if different
                        ...(location.note &&
                            location.note !== existing.note && {
                                note: existing.note
                                    ? `${existing.note}; ${location.note}`
                                    : location.note,
                            }),
                    });
                }
                // If current priority is lower, keep existing (do nothing)
            } else {
                // First time seeing this location
                locationMap.set(key, { ...location });
            }
        }

        // Convert map to array and sort
        const unique = Array.from(locationMap.values());

        return unique.sort((a, b) => {
            // Sort routes numerically
            const aRoute = a.name.match(/Route (\d+)/);
            const bRoute = b.name.match(/Route (\d+)/);

            if (aRoute && bRoute) {
                return parseInt(aRoute[1]) - parseInt(bRoute[1]);
            } else if (aRoute) {
                return -1; // Routes first
            } else if (bRoute) {
                return 1;
            } else {
                return a.name.localeCompare(b.name);
            }
        });
    }

    extractGenerationSpecificData(content, generation) {
        // Generation-specific patterns and their associated game names
        const generationInfo = {
            8: {
                patterns: [
                    /Sword.*?Shield/i,
                    /Galar/i,
                    /Generation VIII/i,
                    /SwSh/i,
                ],
                games: ["Sword", "Shield"],
                headers: ["Sword", "Shield", "SwSh", "VIII", "Galar"],
                displayName: "Sword/Shield",
            },
            9: {
                patterns: [
                    /Scarlet.*?Violet/i,
                    /Paldea/i,
                    /Generation IX/i,
                    /SV/i,
                ],
                games: ["Scarlet", "Violet"],
                headers: ["Scarlet", "Violet", "SV", "IX", "Paldea"],
                displayName: "Scarlet/Violet",
            },
            7: {
                patterns: [
                    /Sun.*?Moon/i,
                    /Alola/i,
                    /Generation VII/i,
                    /SM/i,
                    /USUM/i,
                ],
                games: ["Sun", "Moon", "Ultra Sun", "Ultra Moon"],
                headers: ["Sun", "Moon", "USUM", "SM", "VII", "Alola"],
                displayName: "Sun/Moon",
            },
            6: {
                patterns: [/X.*?Y/i, /Kalos/i, /Generation VI/i, /XY/i],
                games: ["X", "Y"],
                headers: ["X", "Y", "XY", "VI", "Kalos"],
                displayName: "X/Y",
            },
            5: {
                patterns: [
                    /Black.*?White/i,
                    /Unova/i,
                    /Generation V/i,
                    /BW/i,
                    /B2W2/i,
                ],
                games: ["Black", "White", "Black 2", "White 2"],
                headers: ["Black", "White", "BW", "B2W2", "V", "Unova"],
                displayName: "Black/White",
            },
        };

        const genInfo = generationInfo[generation];
        if (!genInfo) return { content, gameNames: ["Unknown"] };

        // Look for generation-specific sections - try subsections first
        const subsections = content.split(/====.*?====/);

        for (const subsection of subsections) {
            if (genInfo.patterns.some((pattern) => pattern.test(subsection))) {
                return {
                    content: subsection,
                    gameNames: [genInfo.displayName],
                    genInfo,
                };
            }
        }

        // Try main sections
        const sections = content.split(/===.*?===/);

        for (const section of sections) {
            // Check if section contains generation-specific content
            if (genInfo.patterns.some((pattern) => pattern.test(section))) {
                return {
                    content: section,
                    gameNames: [genInfo.displayName],
                    genInfo,
                };
            }

            // Check for generation headers
            if (
                genInfo.headers.some((header) =>
                    new RegExp(header, "i").test(section.substring(0, 300))
                )
            ) {
                return {
                    content: section,
                    gameNames: [genInfo.displayName],
                    genInfo,
                };
            }
        }

        // If no specific section found, check if the main content contains generation data
        if (genInfo.patterns.some((pattern) => pattern.test(content))) {
            return {
                content,
                gameNames: [genInfo.displayName],
                genInfo,
            };
        }

        return null;
    }

    parseEncounterTables(content, generation) {
        const encounters = [];

        try {
            // Look for location tables - these often contain detailed encounter info
            // Pattern for route/location headers
            const locationHeaders = content.match(
                /\[\[([^|\]]+)(?:\|[^\]]+)?\]\]/g
            );

            if (locationHeaders) {
                for (const header of locationHeaders) {
                    const locationName = header
                        .replace(/\[\[|\]\]/g, "")
                        .split("|")[0];

                    // Skip non-location links (like Pokemon names, items, etc.)
                    if (this.isLocationName(locationName)) {
                        const encounter = this.parseLocationBlock(
                            content,
                            locationName,
                            generation
                        );
                        if (encounter) {
                            encounters.push(encounter);
                        }
                    }
                }
            }

            // Look for table structures with encounter data
            const tableMatches = content.match(/\{\|[^}]*\|\}/g);
            if (tableMatches) {
                for (const table of tableMatches) {
                    const tableEncounters = this.parseEncounterTable(
                        table,
                        generation
                    );
                    encounters.push(...tableEncounters);
                }
            }
        } catch (error) {
            console.error("Error parsing encounter tables:", error);
        }

        return encounters;
    }

    parseLocationBlock(content, locationName, generation) {
        try {
            // Create pattern to find content related to this location
            const locationPattern = new RegExp(
                `\\[\\[${locationName}[^\\]]*\\]\\]([\\s\\S]*?)(?=\\[\\[|$)`,
                "i"
            );
            const match = content.match(locationPattern);

            if (!match) return null;

            const locationContent = match[1];

            // Extract encounter information from the location block
            const encounter = {
                name: this.cleanLocationName(locationName),
                method: "Walking",
                encounters: [],
            };

            // Look for percentage patterns
            const percentageMatches =
                locationContent.match(/(\d+(?:\.\d+)?)%/g);
            if (percentageMatches) {
                encounter.chance = percentageMatches[0];
            }

            // Look for level patterns
            const levelMatches = locationContent.match(
                /(?:Lv\.?\s*|Level\s*)(\d+)(?:\s*[-–]\s*(\d+))?/gi
            );
            if (levelMatches) {
                const levelMatch = levelMatches[0];
                const levels = levelMatch.match(/(\d+)(?:\s*[-–]\s*(\d+))?/);
                if (levels) {
                    encounter.minLevel = parseInt(levels[1]);
                    encounter.maxLevel = levels[2]
                        ? parseInt(levels[2])
                        : parseInt(levels[1]);
                }
            }

            // Look for encounter methods
            const methodPatterns = {
                Walking: /walk|grass|overworld/i,
                Surfing: /surf/i,
                Fishing: /fish/i,
                "Max Raid": /raid/i,
                Static: /static|guaranteed/i,
            };

            for (const [method, pattern] of Object.entries(methodPatterns)) {
                if (pattern.test(locationContent)) {
                    encounter.method = method;
                    break;
                }
            }

            return encounter;
        } catch (error) {
            console.error("Error parsing location block:", error);
            return null;
        }
    }

    parseEncounterTable(tableContent, generation) {
        const encounters = [];

        try {
            // Split table into rows
            const rows = tableContent.split(/\|-/).slice(1); // Skip header

            for (const row of rows) {
                const cells = row.split(/\s*\|\s*/);

                if (cells.length >= 3) {
                    // Try to extract location, method, rate, level from table cells
                    const encounter = this.parseTableRow(cells);
                    if (encounter) {
                        encounters.push(encounter);
                    }
                }
            }
        } catch (error) {
            console.error("Error parsing encounter table:", error);
        }

        return encounters;
    }

    parseTableRow(cells) {
        try {
            const encounter = {};

            // Look through cells for recognizable patterns
            for (const cell of cells) {
                const cleanCell = cell.replace(/[{}|]/g, "").trim();

                // Location names (containing Route, Cave, etc.)
                if (
                    /Route|Cave|Forest|Mountain|Lake|City|Town|Beach|Field|Path/i.test(
                        cleanCell
                    )
                ) {
                    encounter.name = this.cleanLocationName(cleanCell);
                }

                // Percentages
                const percentMatch = cleanCell.match(/(\d+(?:\.\d+)?)%/);
                if (percentMatch) {
                    encounter.chance = percentMatch[0];
                }

                // Levels
                const levelMatch = cleanCell.match(
                    /(?:Lv\.?\s*|Level\s*)(\d+)(?:\s*[-–]\s*(\d+))?/i
                );
                if (levelMatch) {
                    encounter.minLevel = parseInt(levelMatch[1]);
                    encounter.maxLevel = levelMatch[2]
                        ? parseInt(levelMatch[2])
                        : parseInt(levelMatch[1]);
                }

                // Methods
                if (/walk|grass|overworld/i.test(cleanCell))
                    encounter.method = "Walking";
                else if (/surf/i.test(cleanCell)) encounter.method = "Surfing";
                else if (/fish/i.test(cleanCell)) encounter.method = "Fishing";
                else if (/raid/i.test(cleanCell)) encounter.method = "Max Raid";
            }

            return encounter.name ? encounter : null;
        } catch (error) {
            console.error("Error parsing table row:", error);
            return null;
        }
    }

    parseLocationLists(content) {
        const locations = [];

        try {
            console.log("Parsing location lists from content...");

            // Find all location links
            const locationMatches = content.match(
                /\[\[([^|\]]+)(?:\|[^\]]+)?\]\]/g
            );

            if (locationMatches) {
                // Debug:"Found location matches:", locationMatches);

                for (const match of locationMatches) {
                    const locationName = match
                        .replace(/\[\[|\]\]/g, "")
                        .split("|")[0];
                    // Debug:"Processing location:", locationName);

                    // Special handling for routes
                    if (/^Route$/i.test(locationName.trim())) {
                        // Found generic "Route" - need to extract numbers from context
                        // This is a generic "Route" link, we need to find the numbers in the surrounding text
                        const routeContext = this.extractRouteContext(
                            content,
                            match
                        );
                        if (routeContext) {
                            locations.push(...routeContext);
                        }
                    } else if (this.isLocationName(locationName)) {
                        locations.push({
                            name: this.cleanLocationName(locationName),
                            method: "See Bulbapedia for details",
                            note: "Basic location data",
                        });
                    }
                }
            }

            // Remove duplicates
            const uniqueLocations = locations.filter(
                (location, index, self) =>
                    index === self.findIndex((l) => l.name === location.name)
            );

            console.log("Parsed unique locations:", uniqueLocations);
            return uniqueLocations;
        } catch (error) {
            console.error("Error parsing location lists:", error);
            return [];
        }
    }

    extractRouteContext(content, routeMatch) {
        const locations = [];

        try {
            // Find the position of the route match in the content
            const matchIndex = content.indexOf(routeMatch);
            if (matchIndex === -1) return locations;

            // Extract surrounding context (100 characters before and after)
            const start = Math.max(0, matchIndex - 100);
            const end = Math.min(
                content.length,
                matchIndex + routeMatch.length + 100
            );
            const context = content.substring(start, end);

            console.log("Route context:", context);

            // Look for numbers in the context around the "Route" mention
            const numberPatterns = [
                /Routes?\s+(\d+(?:\s*(?:,\s*)?(?:and\s+)?\d+)*)/gi,
                /Route\s+(\d+)/gi,
                /(\d+)(?:\s*(?:,\s*)?(?:and\s+)?\d+)*\s*(?:and\s+)?(?:,\s*)?\[\[Route\]\]/gi,
            ];

            for (const pattern of numberPatterns) {
                let match;
                while ((match = pattern.exec(context)) !== null) {
                    const numbersText = match[1];
                    const numbers = numbersText.match(/\d+/g);
                    if (numbers) {
                        // Debug:"Found route numbers in context:", numbers);
                        for (const num of numbers) {
                            locations.push({
                                name: `Route ${num}`,
                                method: "Walking",
                                note: "Route from context extraction",
                            });
                        }
                    }
                }
            }
        } catch (error) {
            console.error("Error extracting route context:", error);
        }

        return locations;
    }

    isLocationName(name) {
        // Check if the name looks like a location rather than a Pokemon, item, etc.
        const locationKeywords = [
            "Route",
            "Cave",
            "Forest",
            "Mountain",
            "Lake",
            "City",
            "Town",
            "Beach",
            "Field",
            "Path",
            "Road",
            "Bridge",
            "Valley",
            "Hill",
            "Island",
            "Bay",
            "River",
            "Garden",
            "Park",
            "Ruins",
            "Tower",
            "Gym",
            "Center",
            "Market",
            "Port",
            "Harbor",
            "Station",
            "Tunnel",
            "Den",
            "Dens",
            "Area",
            "Zone",
            "Riverbank",
            "Wilderness",
        ];

        // Enhanced route detection
        if (/Route\s*\d+/i.test(name)) {
            return true;
        }

        // Check for location keywords
        const hasLocationKeyword = locationKeywords.some((keyword) =>
            name.toLowerCase().includes(keyword.toLowerCase())
        );

        // Exclude obvious non-locations (Pokemon names, items, etc.)
        const excludePatterns = [
            /pokemon/i,
            /move/i,
            /ability/i,
            /item/i,
            /type/i,
            /generation/i,
            /category/i,
        ];

        const isExcluded = excludePatterns.some((pattern) =>
            pattern.test(name)
        );

        return hasLocationKeyword && !isExcluded;
    }

    cleanLocationName(name) {
        // Clean up location names from wikitext artifacts
        return name
            .replace(/\{\{.*?\}\}/g, "") // Remove templates
            .replace(/\[\[|\]\]/g, "") // Remove links
            .replace(/\|.*$/, "") // Remove pipe and everything after
            .replace(/^\s+|\s+$/g, "") // Trim whitespace
            .replace(/\s+/g, " "); // Normalize whitespace
    }

    formatPokemonNameForBulbapedia(pokemonName) {
        // Handle special cases and format for Bulbapedia URLs
        const name = pokemonName.toLowerCase();

        // Special handling for Eiscue - Ice and Noice forms are the same pokemon
        // Bulbapedia uses just "Eiscue" for the main page
        if (
            name === "eiscue-ice" ||
            name === "eiscue-noice" ||
            name === "eiscue"
        ) {
            return "Eiscue";
        }

        // Paradox Pokemon - convert hyphens to underscores and capitalize each word
        const paradoxPokemon = [
            "scream-tail",
            "brute-bonnet",
            "flutter-mane",
            "slither-wing",
            "sandy-shocks",
            "roaring-moon",
            "great-tusk",
            "walking-wake",
            "gouging-fire",
            "raging-bolt",
            "iron-bundle",
            "iron-hands",
            "iron-jugulis",
            "iron-moth",
            "iron-thorns",
            "iron-treads",
            "iron-valiant",
            "iron-leaves",
            "iron-boulder",
            "iron-crown",
        ];

        if (paradoxPokemon.includes(name)) {
            // Convert hyphens to underscores and capitalize each word
            return name
                .split("-")
                .map((word) => this.capitalizeFirst(word))
                .join("_");
        }

        // Regional forms
        if (name.includes("-")) {
            const parts = name.split("-");
            if (parts[1] === "alola" || parts[1] === "alolan") {
                return this.capitalizeFirst(parts[0]) + " (Alolan)";
            }
            if (parts[1] === "galar" || parts[1] === "galarian") {
                return this.capitalizeFirst(parts[0]) + " (Galarian)";
            }
            if (parts[1] === "hisui" || parts[1] === "hisuian") {
                return this.capitalizeFirst(parts[0]) + " (Hisuian)";
            }
            if (parts[1] === "paldea" || parts[1] === "paldean") {
                return this.capitalizeFirst(parts[0]) + " (Paldean)";
            }
        }

        // Standard formatting - convert hyphens to underscores for other multi-word names
        if (name.includes("-")) {
            return name
                .split("-")
                .map((word) => this.capitalizeFirst(word))
                .join("_");
        }

        return this.capitalizeFirst(name);
    }

    async displayBulbapediaLocations(
        container,
        locations,
        pokemonName,
        gameNames = ["Locations Found"]
    ) {
        const bulbapediaUrl = await this.getBulbapediaUrl(pokemonName);
        let html = `
            <div class="bulbapedia-disclaimer">
                <p><i class="fas fa-info-circle"></i> Location data from Bulbapedia - 
                <a href="${bulbapediaUrl}" target="_blank" rel="noopener">
                    View detailed location information
                </a></p>
            </div>
        `;

        if (locations && locations.length > 0) {
            const gameTitle = Array.isArray(gameNames)
                ? gameNames.join(" / ")
                : gameNames;
            html += `<div class="game-group"><h4 class="game-title">${gameTitle}</h4><div class="game-locations">`;

            // Locations are already sorted by deduplicateLocations
            locations.forEach((location) => {
                html += `
                    <div class="location-item">
                        <div class="location-name">${location.name}</div>
                        <div class="location-details">
                            <span class="location-method">${
                                location.method || "Walking"
                            }</span>
                            ${
                                location.chance
                                    ? `<span class="location-chance">${location.chance}</span>`
                                    : ""
                            }
                            ${this.formatLevelRange(
                                location.minLevel,
                                location.maxLevel
                            )}
                            ${
                                location.note
                                    ? `<span class="location-note">${location.note}</span>`
                                    : ""
                            }
                        </div>
                    </div>
                `;
            });

            html += "</div></div>";
        }

        container.innerHTML = html;
    }

    formatLevelRange(minLevel, maxLevel) {
        if (!minLevel && !maxLevel) return "";

        if (minLevel && maxLevel) {
            if (minLevel === maxLevel) {
                return `<span class="location-level">Lv.${minLevel}</span>`;
            } else {
                return `<span class="location-level">Lv.${minLevel}-${maxLevel}</span>`;
            }
        } else if (minLevel) {
            return `<span class="location-level">Lv.${minLevel}+</span>`;
        } else if (maxLevel) {
            return `<span class="location-level">Lv.1-${maxLevel}</span>`;
        }

        return "";
    }

    async displayNoEncounters(container, pokemonName) {
        const bulbapediaUrl = await this.getBulbapediaUrl(pokemonName);
        container.innerHTML = `
            <div class="no-location-with-link">
                <div class="no-location">This Pokemon cannot be found in the wild in this generation</div>
                <div class="bulbapedia-disclaimer">
                    <p><i class="fas fa-external-link-alt"></i> 
                    <a href="${bulbapediaUrl}" target="_blank" rel="noopener">
                        Check Bulbapedia for complete location information
                    </a></p>
                </div>
            </div>
        `;
    }

    async getSpeciesName(pokemonData) {
        // Fetch species data to get the actual species name
        if (pokemonData.species) {
            try {
                // If species is already an object with name, use it directly
                if (pokemonData.species.name) {
                    return pokemonData.species.name;
                }

                // Otherwise, fetch from URL
                if (pokemonData.species.url) {
                    const speciesData = await this.getPokemonSpecies(
                        pokemonData.species.url
                    );
                    if (speciesData && speciesData.name) {
                        return speciesData.name;
                    }
                }
            } catch (error) {
                console.warn("Error fetching species data:", error);
            }
        }

        // Fallback: try to extract from URL if fetch fails (but avoid IDs)
        if (pokemonData.species && pokemonData.species.url) {
            const urlParts = pokemonData.species.url
                .split("/")
                .filter((part) => part);
            const lastPart = urlParts[urlParts.length - 1];
            // Only use if it's not a pure number (ID)
            if (lastPart && isNaN(parseInt(lastPart))) {
                return lastPart;
            }
        }

        // Final fallback: try to get base name from pokemon name
        const baseName = this.getBasePokemonName(
            pokemonData.name.toLowerCase()
        );
        // If base name is still a number, return the pokemon name itself
        if (baseName && !isNaN(parseInt(baseName))) {
            return pokemonData.name.toLowerCase();
        }
        return baseName;
    }

    getFormNameForDisplay(pokemonName, speciesName) {
        const name = pokemonName.toLowerCase();
        const species = speciesName.toLowerCase();

        // If the names are the same, no form to display
        if (name === species) {
            return null;
        }

        // Use the formatFormName function but return the formatted form name
        return this.formatFormName(pokemonName);
    }

    async getBulbapediaUrl(pokemonName) {
        // Get the species name for Bulbapedia link
        const pokemonData = await this.getPokemonData(pokemonName);
        if (!pokemonData) {
            // Fallback to original behavior if we can't get the data
            const formattedName =
                this.formatPokemonNameForBulbapedia(pokemonName);
            return `https://bulbapedia.bulbagarden.net/wiki/${encodeURIComponent(
                formattedName + "_(Pokémon)"
            )}#Game_locations`;
        }

        const speciesName = await this.getSpeciesName(pokemonData);
        const formattedName = this.formatPokemonNameForBulbapedia(speciesName);
        return `https://bulbapedia.bulbagarden.net/wiki/${encodeURIComponent(
            formattedName + "_(Pokémon)"
        )}#Game_locations`;
    }

    // Utility methods
    formatPokemonName(pokemonName) {
        // Handle regional forms and special cases
        const name = pokemonName.toLowerCase();

        // Special handling for Eiscue - Ice and Noice forms are the same pokemon
        if (
            name === "eiscue-ice" ||
            name === "eiscue-noice" ||
            name === "eiscue"
        ) {
            return "Eiscue";
        }

        // Paradox Pokemon - treat as multi-word names, not forms
        const paradoxPokemon = [
            "scream-tail",
            "brute-bonnet",
            "flutter-mane",
            "slither-wing",
            "sandy-shocks",
            "roaring-moon",
            "great-tusk",
            "walking-wake",
            "gouging-fire",
            "raging-bolt",
            "iron-bundle",
            "iron-hands",
            "iron-jugulis",
            "iron-moth",
            "iron-thorns",
            "iron-treads",
            "iron-valiant",
            "iron-leaves",
            "iron-boulder",
            "iron-crown",
        ];

        if (paradoxPokemon.includes(name)) {
            // Format as multi-word name: "Scream Tail", "Iron Bundle", etc.
            return name
                .split("-")
                .map((word) => this.capitalizeFirst(word))
                .join(" ");
        }

        // Regional form mappings
        const regionalForms = {
            alolan: "Alolan",
            galarian: "Galarian",
            hisuian: "Hisuian",
            paldean: "Paldean",
        };

        // Check for regional forms
        for (const [key, display] of Object.entries(regionalForms)) {
            if (name.includes(key)) {
                const baseName = name.replace(`-${key}`, "").replace(key, "");
                return `${display} ${this.capitalizeFirst(baseName)}`;
            }
        }

        // Handle other special forms
        if (name.includes("-")) {
            const parts = name.split("-");
            const baseName = parts[0];
            const form = parts.slice(1).join(" ");

            // Special form handling
            const formMappings = {
                mega: "Mega",
                primal: "Primal",
                origin: "Origin Forme",
                altered: "Altered Forme",
                sky: "Sky Forme",
                land: "Land Forme",
                black: "Black",
                white: "White",
                therian: "Therian Forme",
                incarnate: "Incarnate Forme",
            };

            const mappedForm = formMappings[form] || this.capitalizeFirst(form);
            return `${this.capitalizeFirst(baseName)} (${mappedForm})`;
        }

        return this.capitalizeFirst(name);
    }

    capitalizeFirst(str) {
        return str.charAt(0).toUpperCase() + str.slice(1);
    }

    capitalizeWords(str) {
        return str
            .split(" ")
            .map((word) => this.capitalizeFirst(word))
            .join(" ");
    }

    formatGameName(versionName) {
        const gameNameMap = {
            red: "Red",
            blue: "Blue",
            yellow: "Yellow",
            gold: "Gold",
            silver: "Silver",
            crystal: "Crystal",
            ruby: "Ruby",
            sapphire: "Sapphire",
            emerald: "Emerald",
            firered: "FireRed",
            leafgreen: "LeafGreen",
            diamond: "Diamond",
            pearl: "Pearl",
            platinum: "Platinum",
            heartgold: "HeartGold",
            soulsilver: "SoulSilver",
            black: "Black",
            white: "White",
            "black-2": "Black 2",
            "white-2": "White 2",
            x: "X",
            y: "Y",
            "omega-ruby": "Omega Ruby",
            "alpha-sapphire": "Alpha Sapphire",
            sun: "Sun",
            moon: "Moon",
            "ultra-sun": "Ultra Sun",
            "ultra-moon": "Ultra Moon",
            sword: "Sword",
            shield: "Shield",
            scarlet: "Scarlet",
            violet: "Violet",
        };

        return gameNameMap[versionName] || this.capitalizeFirst(versionName);
    }

    getGameOrderForGeneration(generation) {
        const gameOrders = {
            1: ["Red", "Blue", "Yellow"],
            2: ["Gold", "Silver", "Crystal"],
            3: ["Ruby", "Sapphire", "Emerald", "FireRed", "LeafGreen"],
            4: ["Diamond", "Pearl", "Platinum", "HeartGold", "SoulSilver"],
            5: ["Black", "White", "Black 2", "White 2"],
            6: ["X", "Y", "Omega Ruby", "Alpha Sapphire"],
            7: ["Sun", "Moon", "Ultra Sun", "Ultra Moon"],
            8: ["Sword", "Shield"],
            9: ["Scarlet", "Violet"],
        };

        return gameOrders[generation] || [];
    }

    formatEncounterMethod(method, conditions, locationAreaData) {
        // Map encounter methods to more descriptive text
        const methodMap = {
            walk: "Walking",
            surf: "Surfing",
            "old-rod": "Old Rod",
            "good-rod": "Good Rod",
            "super-rod": "Super Rod",
            "rock-smash": "Rock Smash",
            headbutt: "Headbutt",
            "dark-grass": "Dark Grass",
            "grass-spots": "Grass Patches",
            cave: "Cave",
            bridge: "Bridge",
            "super-rod-spots": "Super Rod (Spots)",
            "surf-spots": "Surfing (Spots)",
            "yellow-flowers": "Yellow Flowers",
            "purple-flowers": "Purple Flowers",
            "red-flowers": "Red Flowers",
            "rough-terrain": "Rough Terrain",
        };

        let methodText =
            methodMap[method] ||
            this.capitalizeWords(method.replace(/-/g, " "));

        // Add specific terrain/grass information based on location area name
        if (method === "walk" && locationAreaData) {
            const areaName = locationAreaData.name.toLowerCase();
            if (areaName.includes("grass")) {
                methodText = "Tall Grass";
            } else if (areaName.includes("cave")) {
                methodText = "Cave";
            } else if (areaName.includes("forest")) {
                methodText = "Forest";
            } else if (areaName.includes("route")) {
                methodText = "Route";
            } else if (areaName.includes("area")) {
                methodText = "Wild Area";
            }
        }

        // Add conditions for more specific information
        if (conditions && conditions.length > 0) {
            const conditionMap = {
                swarm: "Swarm",
                "time-morning": "Morning",
                "time-day": "Day",
                "time-night": "Night",
                radar: "PokeRadar",
                "slot2-ruby": "Ruby inserted",
                "slot2-sapphire": "Sapphire inserted",
                "slot2-emerald": "Emerald inserted",
                "slot2-firered": "FireRed inserted",
                "slot2-leafgreen": "LeafGreen inserted",
                "radio-hoenn": "Hoenn Sound",
                "radio-sinnoh": "Sinnoh Sound",
                "season-spring": "Spring",
                "season-summer": "Summer",
                "season-autumn": "Autumn",
                "season-winter": "Winter",
            };

            const conditionTexts = conditions
                .map(
                    (condition) =>
                        conditionMap[condition] ||
                        this.capitalizeWords(condition.replace(/-/g, " "))
                )
                .filter((text) => text);

            if (conditionTexts.length > 0) {
                methodText += ` (${conditionTexts.join(", ")})`;
            }
        }

        return methodText;
    }

    isRegionalForm(pokemonName) {
        const regionalKeywords = ["alolan", "galarian", "hisuian", "paldean"];
        return regionalKeywords.some((keyword) =>
            pokemonName.toLowerCase().includes(keyword)
        );
    }

    toRoman(num) {
        const romanNumerals = {
            1: "I",
            2: "II",
            3: "III",
            4: "IV",
            5: "V",
            6: "VI",
            7: "VII",
            8: "VIII",
            9: "IX",
        };
        return romanNumerals[num] || num.toString();
    }

    async getPokemonData(pokemonName) {
        if (this.pokemonCache.has(pokemonName)) {
            return this.pokemonCache.get(pokemonName);
        }

        try {
            const response = await fetch(
                `https://pokeapi.co/api/v2/pokemon/${pokemonName.toLowerCase()}`
            );
            if (!response.ok) {
                // Silently handle 404s (expected for non-existent forms)
                // Only log for other errors
                if (response.status !== 404) {
                    console.warn(`Failed to fetch Pokemon ${pokemonName}: ${response.status}`);
                }
                // Cache null to avoid repeated failed requests
                this.pokemonCache.set(pokemonName, null);
                return null;
            }

            const data = await response.json();
            this.pokemonCache.set(pokemonName, data);
            return data;
        } catch (error) {
            // Only log network errors, not 404s
            if (error.name !== 'TypeError' || !error.message.includes('fetch')) {
                console.warn(`Error fetching Pokemon data for ${pokemonName}:`, error);
            }
            // Cache null to avoid repeated failed requests
            this.pokemonCache.set(pokemonName, null);
            return null;
        }
    }

    async getPokemonSpecies(speciesUrl) {
        if (this.speciesCache.has(speciesUrl)) {
            return this.speciesCache.get(speciesUrl);
        }

        try {
            const response = await fetch(speciesUrl);
            const data = await response.json();
            this.speciesCache.set(speciesUrl, data);
            return data;
        } catch (error) {
            console.error("Error fetching species data:", error);
            return null;
        }
    }

    async getEvolutionChain(evolutionUrl) {
        if (this.evolutionCache.has(evolutionUrl)) {
            return this.evolutionCache.get(evolutionUrl);
        }

        try {
            const response = await fetch(evolutionUrl);
            const data = await response.json();
            this.evolutionCache.set(evolutionUrl, data);
            return data;
        } catch (error) {
            console.error("Error fetching evolution chain:", error);
            return null;
        }
    }

    async getLocationAreaData(locationAreaUrl) {
        if (this.locationAreaCache.has(locationAreaUrl)) {
            return this.locationAreaCache.get(locationAreaUrl);
        }

        try {
            const response = await fetch(locationAreaUrl);
            const data = await response.json();
            this.locationAreaCache.set(locationAreaUrl, data);
            return data;
        } catch (error) {
            console.error("Error fetching location area data:", error);
            return null;
        }
    }

    getGenerationTypes() {
        const allTypes = [
            "normal",
            "fire",
            "water",
            "electric",
            "grass",
            "ice",
            "fighting",
            "poison",
            "ground",
            "flying",
            "psychic",
            "bug",
            "rock",
            "ghost",
            "dragon",
        ];

        if (this.currentGeneration >= 2) {
            allTypes.push("dark", "steel");
        }
        if (this.currentGeneration >= 6) {
            allTypes.push("fairy");
        }

        return allTypes;
    }

    getPokemonTypesForGeneration(pokemonName, originalTypes) {
        const name = pokemonName.toLowerCase();

        if (this.generationData.pokemonTypingChanges[name]) {
            const generationTypes =
                this.generationData.pokemonTypingChanges[name][
                    this.currentGeneration
                ];
            if (generationTypes && generationTypes.length > 0) {
                return generationTypes.map((type) => ({
                    type: { name: type },
                }));
            }
        }

        return originalTypes.filter((typeObj) => {
            const typeName = typeObj.type.name;
            const introGeneration =
                this.generationData.typeIntroduction[typeName];
            return (
                !introGeneration || this.currentGeneration >= introGeneration
            );
        });
    }

    getTypeEffectiveness(attackType, defenseType) {
        if (this.typeChart && this.typeChart[attackType]) {
            const effectiveness = this.typeChart[attackType][defenseType];
            if (effectiveness === 0) return 0;
            if (effectiveness !== undefined && effectiveness !== null)
                return effectiveness;
        }
        return 1;
    }

    isVersionGroupInGeneration(versionGroup, generation) {
        const versionGroupMap = {
            1: ["red-blue", "yellow"],
            2: ["gold-silver", "crystal"],
            3: ["ruby-sapphire", "emerald", "firered-leafgreen"],
            4: ["diamond-pearl", "platinum", "heartgold-soulsilver"],
            5: ["black-white", "black-2-white-2"],
            6: ["x-y", "omega-ruby-alpha-sapphire"],
            7: ["sun-moon", "ultra-sun-ultra-moon"],
            8: ["sword-shield"],
            9: ["scarlet-violet"],
        };

        return versionGroupMap[generation]?.includes(versionGroup) || false;
    }

    isVersionInGeneration(version, generation) {
        const versionMap = {
            1: ["red", "blue", "yellow"],
            2: ["gold", "silver", "crystal"],
            3: ["ruby", "sapphire", "emerald", "firered", "leafgreen"],
            4: ["diamond", "pearl", "platinum", "heartgold", "soulsilver"],
            5: ["black", "white", "black-2", "white-2"],
            6: ["x", "y", "omega-ruby", "alpha-sapphire"],
            7: ["sun", "moon", "ultra-sun", "ultra-moon"],
            8: ["sword", "shield"],
            9: ["scarlet", "violet"],
        };

        return versionMap[generation]?.includes(version) || false;
    }

    // Event handlers
    handleSearch() {
        const searchInput = document.getElementById("pokemon-search");
        if (searchInput.value.trim()) {
            this.searchPokemon({ target: searchInput });
        }
    }

    // Check for existing content in search input on page load
    checkSearchInputOnLoad() {
        const pokemonInput = document.getElementById("pokemon-search");

        // Check Pokemon search input
        if (pokemonInput && pokemonInput.value.trim()) {
            const wrapper = pokemonInput.closest(".search-input-wrapper");
            if (wrapper) {
                wrapper.classList.add("has-content");
            }
        }
    }

    // Handle search input changes to show/hide clear button
    handleSearchInputChange(e) {
        const wrapper = e.target.closest(".search-input-wrapper");
        if (e.target.value.trim()) {
            wrapper.classList.add("has-content");
        } else {
            wrapper.classList.remove("has-content");
        }
    }

    // Clear button handler
    clearPokemonSearch() {
        const input = document.getElementById("pokemon-search");
        const wrapper = input.closest(".search-input-wrapper");
        input.value = "";
        wrapper.classList.remove("has-content");
        this.hideSearchResults();
        // Clear current Pokemon selection
        document.getElementById("pokemon-display").classList.add("hidden");
        document.getElementById("no-pokemon").style.display = "flex";
        this.currentPokemon = null;
        this.saveToStorage();
        input.focus();
    }

    handleGenerationChange(event) {
        this.currentGeneration = parseInt(event.target.value);

        if (this.currentPokemon) {
            this.selectPokemon(this.currentPokemon);
        }

        this.saveToStorage();
        console.log(`Switched to Generation ${this.currentGeneration}`);
    }

    handleMoveTab(event) {
        const tabName = event.target.dataset.tab;

        // Update tab buttons
        document.querySelectorAll(".move-tab").forEach((tab) => {
            tab.classList.remove("active");
        });
        event.target.classList.add("active");

        // Update move lists
        document.querySelectorAll(".move-list").forEach((list) => {
            list.classList.remove("active");
        });
        document.getElementById(`${tabName}-moves`).classList.add("active");
    }

    handleEffectivenessTab(event) {
        const tabName = event.target.dataset.tab;

        // Update tab buttons
        document.querySelectorAll(".effectiveness-tab").forEach((tab) => {
            tab.classList.remove("active");
        });
        event.target.classList.add("active");

        // Update effectiveness content
        document
            .querySelectorAll(".effectiveness-content")
            .forEach((content) => {
                content.classList.remove("active");
            });
        document
            .getElementById(`${tabName}-effectiveness`)
            .classList.add("active");

        // If switching to offense tab and it's empty, populate it
        if (tabName === "offense" && this.currentPokemonData) {
            const offenseContainer = document.getElementById(
                "offense-type-effectiveness"
            );
            if (!offenseContainer.innerHTML.trim()) {
                this.displayOffensiveTypeEffectiveness(this.currentPokemonData);
            }
        }
    }

    resetEffectivenessTabs() {
        // Reset all tabs to ensure defense is active
        document.querySelectorAll(".effectiveness-tab").forEach((tab) => {
            tab.classList.remove("active");
        });
        const defenseTab = document.querySelector(
            '.effectiveness-tab[data-tab="defense"]'
        );
        if (defenseTab) {
            defenseTab.classList.add("active");
        }

        // Reset all content areas
        document
            .querySelectorAll(".effectiveness-content")
            .forEach((content) => {
                content.classList.remove("active");
            });
        const defenseContent = document.getElementById("defense-effectiveness");
        if (defenseContent) {
            defenseContent.classList.add("active");
        }

        // Clear offense content to reset state
        const offenseContainer = document.getElementById(
            "offense-type-effectiveness"
        );
        if (offenseContainer) {
            offenseContainer.innerHTML = "";
        }
    }

    hideSearchResults() {
        document.getElementById("search-results").classList.remove("show");
    }

    openBulbapediaAbility(abilityName) {
        const formattedName = abilityName
            .split("-")
            .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
            .join("_");
        const url = `https://bulbapedia.bulbagarden.net/wiki/${formattedName}_(Ability)`;
        window.open(url, "_blank");
    }

    async handleBulbapediaClick() {
        if (this.currentPokemon) {
            await this.openBulbapedia(this.currentPokemon);
        }
    }

    async openBulbapedia(pokemonData) {
        // Get the species name for Bulbapedia link
        const speciesName = await this.getSpeciesName(pokemonData);
        const formattedName = this.formatPokemonNameForBulbapedia(speciesName);
        const url = `https://bulbapedia.bulbagarden.net/wiki/${encodeURIComponent(
            formattedName + "_(Pokémon)"
        )}`;
        window.open(url, "_blank");
    }

    // Storage methods
    saveToStorage() {
        try {
            const data = {
                currentPokemon: this.currentPokemon
                    ? {
                          id: this.currentPokemon.id,
                          name: this.currentPokemon.name,
                          sprites: this.currentPokemon.sprites,
                          types: this.currentPokemon.types,
                          species: this.currentPokemon.species,
                      }
                    : null,
                generation: this.currentGeneration,
            };
            localStorage.setItem("poketools-lookup-data", JSON.stringify(data));
        } catch (error) {
            console.error("Failed to save to localStorage:", error);
        }
    }

    loadFromStorage() {
        try {
            const saved = localStorage.getItem("poketools-lookup-data");
            if (saved) {
                const data = JSON.parse(saved);

                if (data.generation) {
                    this.currentGeneration = data.generation;
                    document.getElementById("generation-select").value =
                        data.generation;
                }

                if (data.currentPokemon) {
                    this.getPokemonData(data.currentPokemon.name).then(
                        (pokemonData) => {
                            if (pokemonData) {
                                this.selectPokemon(pokemonData);
                                // Check search inputs after Pokemon is selected and search field is populated
                                setTimeout(
                                    () => this.checkSearchInputOnLoad(),
                                    100
                                );
                            }
                        }
                    );
                } else {
                    // If no current Pokemon, check immediately
                    this.checkSearchInputOnLoad();
                }
            }
        } catch (error) {
            console.error("Failed to load from localStorage:", error);
        }
    }

    async getRandomPokemon() {
        try {
            // Generate random number between 1 and 1024
            const randomId = Math.floor(Math.random() * 1024) + 1;

            // Fetch Pokemon data by ID
            const response = await fetch(
                `https://pokeapi.co/api/v2/pokemon/${randomId}`
            );
            if (!response.ok) {
                throw new Error(`Failed to fetch Pokemon with ID ${randomId}`);
            }

            const pokemonData = await response.json();

            // Cache the Pokemon data
            this.pokemonCache.set(pokemonData.name, pokemonData);

            // Select the random Pokemon
            await this.selectPokemon(pokemonData);
        } catch (error) {
            console.error("Error getting random Pokemon:", error);
            // Show error message to user
            alert("Failed to get random Pokemon. Please try again.");
        }
    }
}

// Initialize the app when DOM is loaded
let pokemonLookup;
document.addEventListener("DOMContentLoaded", () => {
    pokemonLookup = new PokemonLookup();
});
