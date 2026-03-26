const API_KEY = 'd4796fe2ae8a4440aa2021f22834a471'

export async function findRecipes(ingredients) {
  const ingredientList = ingredients.join(',')

  const response = await fetch(
    `https://api.spoonacular.com/recipes/findByIngredients?ingredients=${ingredientList}&number=8&ranking=2&apiKey=${API_KEY}`
  )

  const recipes = await response.json()
  return recipes
}

export async function getRecipeDetails(recipeId) {
  const response = await fetch(
    `https://api.spoonacular.com/recipes/${recipeId}/information?apiKey=${API_KEY}`
  )

  const details = await response.json()
  return details
}