// app.js
class RecipeApp {
    constructor() {
        this.recipes = [];
        this.currentRecipe = null;
        this.editingRecipeId = null;
        this.scaleFactor = 1.0;
        
        // Initialize app
        this.initApp();
    }
    
    initApp() {
        // Load saved recipes
        this.loadRecipes();
        
        // Initialize UI
        this.renderRecipeList();
        this.setupEventListeners();
    }
    
    loadRecipes() {
        const savedRecipes = localStorage.getItem('recipes');
        if (savedRecipes) {
            this.recipes = JSON.parse(savedRecipes);
        } else {
            this.recipes = [];
        }
    }
    
    saveRecipes() {
        localStorage.setItem('recipes', JSON.stringify(this.recipes));
    }
    
    setupEventListeners() {
        // Navigation buttons
        document.getElementById('add-recipe-btn').addEventListener('click', () => this.showRecipeEditor());
        document.getElementById('add-first-recipe-btn').addEventListener('click', () => this.showRecipeEditor());
        document.getElementById('back-to-list-btn').addEventListener('click', () => this.showRecipeList());
        document.getElementById('back-from-detail-btn').addEventListener('click', () => this.showRecipeList());
        
        // Recipe editor
        document.getElementById('save-recipe-btn').addEventListener('click', () => this.saveRecipe());
        document.getElementById('add-ingredient-btn').addEventListener('click', () => this.addIngredient());
        
        // Recipe detail
        document.getElementById('edit-recipe-btn').addEventListener('click', () => {
            this.editingRecipeId = this.currentRecipe.id;
            this.showRecipeEditor(this.currentRecipe);
        });
        
        document.getElementById('scale-factor').addEventListener('input', (e) => {
            this.scaleFactor = parseFloat(e.target.value);
            document.getElementById('scale-factor-value').textContent = this.scaleFactor.toFixed(1);
            this.updateScaledRecipe();
        });
    }
    
    renderRecipeList() {
        const container = document.getElementById('recipes-container');
        const emptyState = document.getElementById('empty-state');
        
        // Clear current list
        container.innerHTML = '';
        
        if (this.recipes.length === 0) {
            emptyState.classList.remove('hidden');
            container.appendChild(emptyState);
            return;
        }
        
        emptyState.classList.add('hidden');
        
        // Create recipe cards
        this.recipes.forEach(recipe => {
            const card = document.createElement('div');
            card.className = 'recipe-card';
            card.innerHTML = `
                <div class="recipe-info">
                    <h3>${recipe.name || 'Untitled Recipe'}</h3>
                    <div class="recipe-meta">
                        ${recipe.ingredients.length} ingredients • ${recipe.baseServings} servings
                    </div>
                </div>
                <div class="actions">
                    <button class="delete-btn" data-id="${recipe.id}">×</button>
                </div>
            `;
            
            // Add event listeners
            card.addEventListener('click', (e) => {
                if (!e.target.classList.contains('delete-btn')) {
                    this.viewRecipeDetail(recipe);
                }
            });
            
            const deleteBtn = card.querySelector('.delete-btn');
            deleteBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                this.deleteRecipe(recipe.id);
            });
            
            container.appendChild(card);
        });
    }
    
    renderIngredientsList(ingredients) {
        const container = document.getElementById('ingredients-list');
        container.innerHTML = '';
        
        ingredients.forEach((ingredient, index) => {
            const item = document.createElement('div');
            item.className = 'ingredient-item';
            item.innerHTML = `
                <div>
                    <strong>${ingredient.name}</strong>
                    <span>${ingredient.quantity} ${ingredient.unit}</span>
                </div>
                <button class="delete-btn" data-index="${index}">×</button>
            `;
            
            item.querySelector('.delete-btn').addEventListener('click', () => {
                this.removeIngredient(index);
            });
            
            container.appendChild(item);
        });
    }
    
    showRecipeList() {
        document.getElementById('recipe-list-view').classList.remove('hidden');
        document.getElementById('recipe-editor-view').classList.add('hidden');
        document.getElementById('recipe-detail-view').classList.add('hidden');
        
        // Refresh the list
        this.renderRecipeList();
    }
    
    showRecipeEditor(recipe = null) {
        document.getElementById('recipe-list-view').classList.add('hidden');
        document.getElementById('recipe-editor-view').classList.remove('hidden');
        document.getElementById('recipe-detail-view').classList.add('hidden');
        
        // Clear form or populate with recipe data
        if (recipe) {
            document.getElementById('editor-title').textContent = 'Edit Recipe';
            document.getElementById('recipe-name').value = recipe.name;
            document.getElementById('base-servings').value = recipe.baseServings;
            this.renderIngredientsList(recipe.ingredients);
        } else {
            document.getElementById('editor-title').textContent = 'New Recipe';
            document.getElementById('recipe-name').value = '';
            document.getElementById('base-servings').value = '1';
            document.getElementById('ingredients-list').innerHTML = '';
        }
        
        // Clear new ingredient form
        document.getElementById('new-ingredient-name').value = '';
        document.getElementById('new-ingredient-quantity').value = '';
        document.getElementById('new-ingredient-unit').value = '';
    }
    
    viewRecipeDetail(recipe) {
        this.currentRecipe = recipe;
        this.scaleFactor = 1.0;
        
        document.getElementById('recipe-list-view').classList.add('hidden');
        document.getElementById('recipe-editor-view').classList.add('hidden');
        document.getElementById('recipe-detail-view').classList.remove('hidden');
        
        // Populate recipe details
        document.getElementById('detail-recipe-name').textContent = recipe.name || 'Untitled Recipe';
        document.getElementById('detail-base-servings').textContent = recipe.baseServings;
        
        // Reset scale factor
        document.getElementById('scale-factor').value = '1';
        document.getElementById('scale-factor-value').textContent = '1.0';
        
        this.updateScaledRecipe();
    }
    
    updateScaledRecipe() {
        if (!this.currentRecipe) return;
        
        const scaledServings = (parseFloat(this.currentRecipe.baseServings) * this.scaleFactor).toFixed(1).replace(/\.0$/, '');
        document.getElementById('scaled-servings-value').textContent = scaledServings;
        
        const ingredientsList = document.getElementById('scaled-ingredients-list');
        ingredientsList.innerHTML = '';
        
        this.currentRecipe.ingredients.forEach(ingredient => {
            const li = document.createElement('li');
            const scaledQuantity = this.getScaledQuantity(ingredient.quantity);
            li.textContent = `${scaledQuantity} ${ingredient.unit} ${ingredient.name}`;
            ingredientsList.appendChild(li);
        });
    }
    
    getScaledQuantity(quantity) {
        const parsed = parseFloat(quantity);
        if (isNaN(parsed)) return quantity;
        
        const scaled = parsed * this.scaleFactor;
        return scaled.toFixed(2).replace(/\.00$/, '');
    }
    
    saveRecipe() {
        const name = document.getElementById('recipe-name').value;
        const baseServings = document.getElementById('base-servings').value;
        
        // Get ingredients from DOM
        const ingredientItems = document.querySelectorAll('.ingredient-item');
        const ingredients = Array.from(ingredientItems).map((item, index) => {
            const text = item.querySelector('div').textContent.trim();
            const nameMatch = text.match(/^(.+?)(?=\s\d)/);
            const quantityMatch = text.match(/(\d+\.?\d*)/);
            const unitMatch = text.match(/(\d+\.?\d*)\s+([^\s]+)(.+)$/);
            
            const name = nameMatch ? nameMatch[0].trim() : `Ingredient ${index + 1}`;
            const quantity = quantityMatch ? quantityMatch[0] : '1';
            const unit = unitMatch ? unitMatch[2] : '';
            
            return { name, quantity, unit };
        });
        
        // Add any new ingredient
        const newName = document.getElementById('new-ingredient-name').value.trim();
        const newQuantity = document.getElementById('new-ingredient-quantity').value.trim();
        const newUnit = document.getElementById('new-ingredient-unit').value.trim();
        
        if (newName && newQuantity) {
            ingredients.push({
                name: newName,
                quantity: newQuantity,
                unit: newUnit
            });
        }
        
        if (!name || ingredients.length === 0) {
            alert('Please enter a recipe name and at least one ingredient.');
            return;
        }
        
        if (this.editingRecipeId) {
            // Update existing recipe
            const index = this.recipes.findIndex(r => r.id === this.editingRecipeId);
            if (index !== -1) {
                this.recipes[index] = {
                    ...this.recipes[index],
                    name,
                    baseServings,
                    ingredients
                };
            }
            this.editingRecipeId = null;
        } else {
            // Create new recipe
            const newRecipe = {
                id: Date.now().toString(),
                name,
                baseServings,
                ingredients,
                createdAt: new Date().toISOString()
            };
            this.recipes.push(newRecipe);
        }
        
        this.saveRecipes();
        this.showRecipeList();
    }
    
    addIngredient() {
        const name = document.getElementById('new-ingredient-name').value.trim();
        const quantity = document.getElementById('new-ingredient-quantity').value.trim();
        const unit = document.getElementById('new-ingredient-unit').value.trim();
        
        if (!name || !quantity) {
            alert('Please enter both name and quantity for the ingredient.');
            return;
        }
        
        const ingredient = { name, quantity, unit };
        
        const container = document.getElementById('ingredients-list');
        const item = document.createElement('div');
        item.className = 'ingredient-item';
        item.innerHTML = `
            <div>
                <strong>${ingredient.name}</strong>
                <span>${ingredient.quantity} ${ingredient.unit}</span>
            </div>
            <button class="delete-btn" data-index="${container.children.length}">×</button>
        `;
        
        item.querySelector('.delete-btn').addEventListener('click', function() {
            container.removeChild(item);
        });
        
        container.appendChild(item);
        
        // Clear input fields
        document.getElementById('new-ingredient-name').value = '';
        document.getElementById('new-ingredient-quantity').value = '';
        document.getElementById('new-ingredient-unit').value = '';
    }
    
    removeIngredient(index) {
        const container = document.getElementById('ingredients-list');
        if (container.children[index]) {
            container.removeChild(container.children[index]);
        }
    }
    
    deleteRecipe(id) {
        if (confirm('Are you sure you want to delete this recipe?')) {
            this.recipes = this.recipes.filter(recipe => recipe.id !== id);
            this.saveRecipes();
            this.renderRecipeList();
        }
    }
}

// Initialize app when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    const app = new RecipeApp();
});
