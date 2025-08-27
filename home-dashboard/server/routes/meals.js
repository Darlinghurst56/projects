const express = require('express');
const multer = require('multer');
const pdf = require('pdf-parse');
const fetch = require('node-fetch');
const config = require('../../config');
const authMiddleware = require('../middleware/auth');

const router = express.Router();

// Apply family meal planning authentication middleware
router.use(authMiddleware.familyMeal);

// Configure multer for PDF file uploads
const upload = multer({
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  },
  fileFilter: (req, file, cb) => {
    if (file.mimetype === 'application/pdf') {
      cb(null, true);
    } else {
      cb(new Error('Only PDF files are allowed'), false);
    }
  },
});

// In-memory storage for meal plans (in production, use a database)
const mealPlans = new Map();

// Get user's meal plan
const getUserMealPlan = (userId) => {
  return mealPlans.get(userId) || null;
};

// Set user's meal plan
const setUserMealPlan = (userId, plan) => {
  mealPlans.set(userId, {
    ...plan,
    userId,
    updatedAt: new Date(),
  });
};

// Extract ingredients from PDF text using AI
const extractIngredientsFromText = async (text) => {
  try {
    const prompt = `Please extract ingredients and food items from this shopping list text. Focus on actual food ingredients that can be used for cooking meals. Return a simple array of ingredient names.

Text: "${text}"

Please respond with just a JSON array of ingredients like: ["chicken", "rice", "tomatoes", "onions"]`;

    const response = await fetch(`${config.services.ollama.baseUrl}/api/generate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: config.services.ollama.model || 'llama3.2',
        prompt,
        stream: false,
      }),
    });

    if (!response.ok) {
      throw new Error(`Ollama API error: ${response.status}`);
    }

    const data = await response.json();
    
    // Try to parse JSON array from response
    try {
      const ingredientsMatch = data.response.match(/\[(.*?)\]/);
      if (ingredientsMatch) {
        const ingredientsStr = '[' + ingredientsMatch[1] + ']';
        const ingredients = JSON.parse(ingredientsStr);
        return Array.isArray(ingredients) ? ingredients : [];
      }
    } catch (parseError) {
      console.error('Failed to parse ingredients JSON:', parseError);
    }

    // Fallback: extract ingredients using simple text processing
    const commonIngredients = [
      'chicken', 'beef', 'pork', 'fish', 'salmon', 'tuna',
      'rice', 'pasta', 'bread', 'noodles',
      'tomatoes', 'onions', 'garlic', 'carrots', 'potatoes',
      'milk', 'eggs', 'cheese', 'butter', 'yogurt',
      'oil', 'salt', 'pepper', 'herbs', 'spices'
    ];

    const textLower = text.toLowerCase();
    const foundIngredients = commonIngredients.filter(ingredient => 
      textLower.includes(ingredient)
    );

    return foundIngredients.length > 0 ? foundIngredients : ['chicken', 'rice', 'vegetables'];
  } catch (error) {
    console.error('Failed to extract ingredients:', error);
    return ['chicken', 'rice', 'vegetables']; // Fallback ingredients
  }
};

// Generate meal suggestions based on ingredients
const generateMealSuggestions = async (ingredients, userId) => {
  try {
    const prompt = `You are a family meal planner. Create a week's worth of evening meal suggestions (Monday to Sunday) using these available ingredients: ${ingredients.join(', ')}.

For each day, suggest:
- A family-friendly dinner name
- Main ingredients needed from the list
- Approximate cooking time
- Difficulty level (Easy/Medium/Hard)

Please respond in this JSON format:
{
  "meals": {
    "Monday": { "name": "Chicken Rice Bowl", "ingredients": "chicken, rice, vegetables", "cookTime": 30, "difficulty": "Easy" },
    "Tuesday": { "name": "...", "ingredients": "...", "cookTime": ..., "difficulty": "..." }
    // ... continue for all 7 days
  }
}`;

    const response = await fetch(`${config.services.ollama.baseUrl}/api/generate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: config.services.ollama.model || 'llama3.2',
        prompt,
        stream: false,
      }),
    });

    if (!response.ok) {
      throw new Error(`Ollama API error: ${response.status}`);
    }

    const data = await response.json();
    
    // Try to parse JSON from response
    try {
      const jsonMatch = data.response.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const mealData = JSON.parse(jsonMatch[0]);
        return {
          meals: mealData.meals || {},
          availableIngredients: ingredients,
          generatedAt: new Date(),
          generatedFrom: 'AI suggestions'
        };
      }
    } catch (parseError) {
      console.error('Failed to parse meal suggestions JSON:', parseError);
    }

    // Fallback meal plan
    const fallbackMeals = {
      Monday: { name: 'Chicken Stir Fry', ingredients: 'chicken, vegetables, rice', cookTime: 25, difficulty: 'Easy' },
      Tuesday: { name: 'Beef Pasta', ingredients: 'beef, pasta, tomatoes', cookTime: 30, difficulty: 'Easy' },
      Wednesday: { name: 'Fish with Rice', ingredients: 'fish, rice, vegetables', cookTime: 20, difficulty: 'Easy' },
      Thursday: { name: 'Chicken Curry', ingredients: 'chicken, rice, spices', cookTime: 35, difficulty: 'Medium' },
      Friday: { name: 'Vegetable Pasta', ingredients: 'pasta, vegetables, cheese', cookTime: 20, difficulty: 'Easy' },
      Saturday: { name: 'Beef Rice Bowl', ingredients: 'beef, rice, vegetables', cookTime: 30, difficulty: 'Easy' },
      Sunday: { name: 'Chicken Roast', ingredients: 'chicken, potatoes, vegetables', cookTime: 60, difficulty: 'Medium' }
    };

    return {
      meals: fallbackMeals,
      availableIngredients: ingredients,
      generatedAt: new Date(),
      generatedFrom: 'AI suggestions'
    };
  } catch (error) {
    console.error('Failed to generate meal suggestions:', error);
    throw error;
  }
};

// Get current meal plan - guest-safe with basic meal suggestions
router.get('/plan', (req, res) => {
  try {
    const userId = req.user.id;
    const isGuest = req.user.isGuest;
    
    if (isGuest) {
      // Provide basic meal suggestions for guests without personal data
      const guestMealPlan = {
        meals: {
          Monday: { name: 'Chicken Stir Fry', ingredients: 'chicken, vegetables, rice', cookTime: 25, difficulty: 'Easy' },
          Tuesday: { name: 'Pasta with Marinara', ingredients: 'pasta, tomatoes, herbs', cookTime: 20, difficulty: 'Easy' },
          Wednesday: { name: 'Fish with Rice', ingredients: 'fish, rice, vegetables', cookTime: 20, difficulty: 'Easy' },
          Thursday: { name: 'Vegetable Curry', ingredients: 'vegetables, rice, spices', cookTime: 30, difficulty: 'Medium' },
          Friday: { name: 'Grilled Chicken', ingredients: 'chicken, potatoes, salad', cookTime: 35, difficulty: 'Easy' },
          Saturday: { name: 'Beef Stew', ingredients: 'beef, potatoes, carrots', cookTime: 45, difficulty: 'Medium' },
          Sunday: { name: 'Roast Dinner', ingredients: 'chicken, potatoes, vegetables', cookTime: 60, difficulty: 'Medium' }
        },
        availableIngredients: ['chicken', 'beef', 'fish', 'pasta', 'rice', 'vegetables', 'potatoes', 'tomatoes'],
        generatedAt: new Date(),
        generatedFrom: 'Guest suggestions',
        isGuestPlan: true,
        note: 'Login to create and save your personal meal plans'
      };
      return res.json(guestMealPlan);
    }
    
    const mealPlan = getUserMealPlan(userId);
    
    if (!mealPlan) {
      return res.status(404).json({ message: 'No meal plan found' });
    }
    
    res.json(mealPlan);
  } catch (error) {
    console.error('Get meal plan error:', error);
    res.status(500).json({ error: 'Failed to get meal plan' });
  }
});

// Upload and process shopping list PDF
router.post('/upload-shopping-list', upload.single('shoppingList'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No PDF file uploaded' });
    }

    const userId = req.user.id;
    
    // Parse PDF content
    const pdfData = await pdf(req.file.buffer);
    const pdfText = pdfData.text;
    
    if (!pdfText.trim()) {
      return res.status(400).json({ error: 'PDF appears to be empty or unreadable' });
    }

    // Extract ingredients from PDF text
    const ingredients = await extractIngredientsFromText(pdfText);
    
    // Generate meal suggestions based on ingredients
    const mealPlan = await generateMealSuggestions(ingredients, userId);
    mealPlan.generatedFrom = `Shopping list PDF (${req.file.originalname})`;
    mealPlan.pdfText = pdfText.substring(0, 1000); // Store first 1000 chars for reference
    
    // Save meal plan
    setUserMealPlan(userId, mealPlan);
    
    res.json(mealPlan);
  } catch (error) {
    console.error('Upload shopping list error:', error);
    res.status(500).json({ 
      error: 'Failed to process shopping list',
      details: error.message 
    });
  }
});

// Generate AI meal suggestions
router.post('/generate-suggestions', async (req, res) => {
  try {
    const userId = req.user.id;
    
    // Use default ingredients if no existing plan
    const existingPlan = getUserMealPlan(userId);
    const ingredients = existingPlan?.availableIngredients || [
      'chicken', 'beef', 'rice', 'pasta', 'vegetables', 
      'tomatoes', 'onions', 'garlic', 'cheese', 'eggs'
    ];
    
    const mealPlan = await generateMealSuggestions(ingredients, userId);
    setUserMealPlan(userId, mealPlan);
    
    res.json(mealPlan);
  } catch (error) {
    console.error('Generate suggestions error:', error);
    res.status(500).json({ 
      error: 'Failed to generate meal suggestions',
      details: error.message 
    });
  }
});

// Update specific meal for a day
router.put('/plan/:day', (req, res) => {
  try {
    const { day } = req.params;
    const mealData = req.body;
    const userId = req.user.id;
    
    const validDays = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
    if (!validDays.includes(day)) {
      return res.status(400).json({ error: 'Invalid day specified' });
    }
    
    let mealPlan = getUserMealPlan(userId);
    if (!mealPlan) {
      // Create new meal plan if none exists
      mealPlan = {
        meals: {},
        availableIngredients: [],
        generatedAt: new Date(),
        generatedFrom: 'Manual entry'
      };
    }
    
    // Update the specific day
    mealPlan.meals[day] = {
      name: mealData.name || '',
      ingredients: mealData.ingredients || '',
      cookTime: mealData.cookTime || null,
      difficulty: mealData.difficulty || null
    };
    
    mealPlan.updatedAt = new Date();
    setUserMealPlan(userId, mealPlan);
    
    res.json({ success: true, meal: mealPlan.meals[day] });
  } catch (error) {
    console.error('Update meal error:', error);
    res.status(500).json({ error: 'Failed to update meal' });
  }
});

// Save entire meal plan
router.post('/plan', (req, res) => {
  try {
    const mealPlan = req.body;
    const userId = req.user.id;
    
    mealPlan.userId = userId;
    mealPlan.updatedAt = new Date();
    
    setUserMealPlan(userId, mealPlan);
    
    res.json({ success: true, plan: mealPlan });
  } catch (error) {
    console.error('Save meal plan error:', error);
    res.status(500).json({ error: 'Failed to save meal plan' });
  }
});

// Delete meal plan
router.delete('/plan', (req, res) => {
  try {
    const userId = req.user.id;
    mealPlans.delete(userId);
    
    res.json({ success: true, message: 'Meal plan deleted' });
  } catch (error) {
    console.error('Delete meal plan error:', error);
    res.status(500).json({ error: 'Failed to delete meal plan' });
  }
});

module.exports = router;