import React, { useState, useEffect } from 'react';
import { mealApi } from '../../services/api';
import './MealPlannerWidget.css';

export const MealPlannerWidget = ({ className = '' }) => {
  const [mealPlan, setMealPlan] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [uploadingPdf, setUploadingPdf] = useState(false);

  useEffect(() => {
    loadCurrentMealPlan();
  }, []);

  const loadCurrentMealPlan = async () => {
    try {
      setLoading(true);
      const response = await mealApi.getCurrentPlan();
      if (response.success) {
        setMealPlan(response.data);
        setError(null);
      }
    } catch (err) {
      console.error('Failed to load meal plan:', err);
      setError('Failed to load meal plan');
    } finally {
      setLoading(false);
    }
  };

  const handlePdfUpload = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    if (file.type !== 'application/pdf') {
      setError('Please upload a PDF file');
      return;
    }

    try {
      setUploadingPdf(true);
      setError(null);
      
      const formData = new FormData();
      formData.append('shoppingList', file);
      
      const response = await mealApi.uploadShoppingList(formData);
      if (response.success) {
        setMealPlan(response.data);
      } else {
        throw new Error(response.message || 'Unable to process your shopping list');
      }
    } catch (err) {
      console.error('Family shopping list upload error:', err);
      setError(err.message || 'Sorry, having trouble with that shopping list. Please try again.');
    } finally {
      setUploadingPdf(false);
      event.target.value = ''; // Reset file input
    }
  };

  const generateMealSuggestions = async () => {
    try {
      setLoading(true);
      const response = await mealApi.generateSuggestions();
      if (response.success) {
        setMealPlan(response.data);
        setError(null);
      } else {
        throw new Error(response.message || 'Unable to create meal suggestions right now');
      }
    } catch (err) {
      console.error('Family meal suggestions error:', err);
      setError(err.message || 'Having trouble creating meal ideas. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const updateMeal = async (day, mealData) => {
    try {
      const response = await mealApi.updateMeal(day, mealData);
      if (response.success) {
        setMealPlan(prev => ({
          ...prev,
          meals: {
            ...prev.meals,
            [day]: mealData
          }
        }));
      }
    } catch (err) {
      console.error('Update meal error:', err);
      setError('Failed to update meal');
    }
  };

  if (loading && !mealPlan) {
    return (
      <div className={`widget-card ${className}`}>
        <div className="widget-header">
          <h3 className="widget-title">Evening Meal Planner</h3>
        </div>
        <div className="widget-content">
          <div className="loading-skeleton" style={{height: '200px', display: 'flex', alignItems: 'center', justifyContent: 'center'}}>
            Loading meal plan...
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`widget-card ${className}`}>
      <div className="widget-header">
        <h3 className="widget-title">Evening Meal Planner</h3>
        <div style={{display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap'}}>
          <label className="btn-secondary" style={{cursor: 'pointer', minHeight: 'var(--touch-target-sm)'}}>
            📄 Upload List
            <input
              type="file"
              accept=".pdf"
              onChange={handlePdfUpload}
              disabled={uploadingPdf}
              style={{ display: 'none' }}
            />
          </label>
          <button 
            className="btn-primary"
            onClick={generateMealSuggestions}
            disabled={loading}
            style={{minHeight: 'var(--touch-target-sm)'}}
          >
            ✨ AI Ideas
          </button>
        </div>
      </div>

      <div className="widget-content">
        {error && (
          <div className="metric-row status-error" style={{marginBottom: '1rem'}}>
            <div style={{display: 'flex', alignItems: 'center', gap: '0.5rem'}}>
              <span>⚠️</span>
              <div>
                <div className="metric-value" style={{color: 'var(--status-error)', fontSize: '0.9rem'}}>
                  Meal Planning Error
                </div>
                <div className="metric-label" style={{margin: 0, fontSize: '0.8rem'}}>
                  {error}
                </div>
              </div>
            </div>
            <button 
              onClick={() => setError(null)} 
              className="btn-secondary"
              style={{minHeight: 'var(--touch-target-sm)', padding: '0.5rem 1rem'}}
            >
              Dismiss
            </button>
          </div>
        )}

        {uploadingPdf && (
          <div style={{
            padding: '1rem',
            backgroundColor: 'var(--status-info-bg)',
            borderRadius: 'var(--border-radius-sm)',
            marginBottom: '1rem',
            textAlign: 'center'
          }}>
            <div className="loading-dots" style={{marginBottom: '0.5rem'}}>
              <div className="loading-dot"></div>
              <div className="loading-dot"></div>
              <div className="loading-dot"></div>
            </div>
            <p style={{margin: 0, color: 'var(--status-info)', fontSize: '0.9rem'}}>Processing shopping list PDF...</p>
          </div>
        )}

        {mealPlan ? (
          <MealPlanDisplay 
            mealPlan={mealPlan} 
            onUpdateMeal={updateMeal}
            loading={loading}
          />
        ) : (
          <div style={{textAlign: 'center', padding: '3rem 2rem', color: 'var(--text-secondary)'}}>
            <div style={{fontSize: '3rem', marginBottom: '1rem'}}>🍽️</div>
            <h4 style={{margin: '0 0 1rem 0', color: 'var(--text-primary)', fontSize: '1.125rem'}}>No meal plan yet</h4>
            <p style={{margin: 0, fontSize: '0.9rem'}}>Upload a shopping list PDF or generate AI meal suggestions to get started.</p>
          </div>
        )}
      </div>
    </div>
  );
};

const MealPlanDisplay = ({ mealPlan, onUpdateMeal, loading }) => {
  const daysOfWeek = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

  return (
    <div>
      <div style={{marginBottom: '1.5rem'}}>
        <h4 style={{margin: '0 0 0.75rem 0', fontWeight: '600', color: 'var(--text-primary)', fontSize: '1.125rem'}}>
          This Week's Evening Meals
        </h4>
        {mealPlan.generatedFrom && (
          <p style={{margin: '0 0 0.75rem 0', fontSize: '0.85rem', color: 'var(--text-secondary)'}}>
            📋 Based on: {mealPlan.generatedFrom}
          </p>
        )}
        {mealPlan.availableIngredients && (
          <div style={{
            fontSize: '0.8rem', 
            color: 'var(--text-tertiary)', 
            padding: '0.75rem', 
            backgroundColor: 'var(--bg-tertiary)', 
            borderRadius: 'var(--border-radius-sm)',
            border: '1px solid var(--border-secondary)'
          }}>
            <strong style={{color: 'var(--text-secondary)'}}>Available ingredients:</strong> {mealPlan.availableIngredients.join(', ')}
          </div>
        )}
      </div>

      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
        gap: '1rem',
        '@media (max-width: 768px)': {
          gridTemplateColumns: '1fr'
        }
      }}>
        {daysOfWeek.map(day => {
          const dayMeal = mealPlan.meals?.[day];
          return (
            <MealCard 
              key={day}
              day={day}
              meal={dayMeal}
              onUpdate={(mealData) => onUpdateMeal(day, mealData)}
              loading={loading}
            />
          );
        })}
      </div>
    </div>
  );
};

const MealCard = ({ day, meal, onUpdate, loading }) => {
  const [editing, setEditing] = useState(false);
  const [editData, setEditData] = useState(meal || {});

  const handleSave = () => {
    onUpdate(editData);
    setEditing(false);
  };

  const handleCancel = () => {
    setEditData(meal || {});
    setEditing(false);
  };

  return (
    <div style={{
      backgroundColor: 'var(--bg-secondary)',
      borderRadius: 'var(--border-radius-sm)',
      padding: '1rem',
      border: '1px solid var(--border-secondary)',
      transition: 'all 0.2s ease-in-out',
      minHeight: '120px'
    }}>
      <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem'}}>
        <h5 style={{margin: 0, fontWeight: '600', color: 'var(--text-primary)', fontSize: '1rem'}}>{day}</h5>
        <button 
          className="btn-secondary"
          onClick={() => setEditing(!editing)}
          disabled={loading}
          style={{minHeight: 'var(--touch-target-sm)', padding: '0.5rem'}}
        >
          {editing ? '💾' : '✏️'}
        </button>
      </div>

      <div>
        {editing ? (
          <div style={{display: 'flex', flexDirection: 'column', gap: '0.75rem'}}>
            <input
              type="text"
              placeholder="Meal name"
              value={editData.name || ''}
              onChange={(e) => setEditData(prev => ({ ...prev, name: e.target.value }))}
              className="input-field"
              style={{fontSize: '0.9rem'}}
            />
            <textarea
              placeholder="Ingredients needed"
              value={editData.ingredients || ''}
              onChange={(e) => setEditData(prev => ({ ...prev, ingredients: e.target.value }))}
              className="input-field"
              rows={3}
              style={{fontSize: '0.9rem', resize: 'vertical'}}
            />
            <div style={{display: 'flex', gap: '0.5rem', justifyContent: 'flex-end'}}>
              <button 
                onClick={handleSave} 
                className="btn-primary"
                style={{minHeight: 'var(--touch-target-sm)', padding: '0.5rem 1rem'}}
              >
                Save
              </button>
              <button 
                onClick={handleCancel} 
                className="btn-secondary"
                style={{minHeight: 'var(--touch-target-sm)', padding: '0.5rem 1rem'}}
              >
                Cancel
              </button>
            </div>
          </div>
        ) : (
          <div>
            {meal ? (
              <>
                <div style={{fontWeight: '600', color: 'var(--text-primary)', marginBottom: '0.5rem', fontSize: '0.95rem'}}>
                  {meal.name || 'Unnamed meal'}
                </div>
                {meal.ingredients && (
                  <div style={{marginBottom: '0.5rem'}}>
                    <div style={{fontSize: '0.8rem', color: 'var(--text-secondary)', fontWeight: '500', marginBottom: '0.25rem'}}>
                      Ingredients:
                    </div>
                    <p style={{margin: 0, fontSize: '0.8rem', color: 'var(--text-tertiary)', lineHeight: '1.4'}}>
                      {meal.ingredients}
                    </p>
                  </div>
                )}
                <div style={{display: 'flex', gap: '1rem', fontSize: '0.8rem', color: 'var(--text-tertiary)'}}>
                  {meal.cookTime && (
                    <span>⏱️ {meal.cookTime} mins</span>
                  )}
                  {meal.difficulty && (
                    <span>🔥 {meal.difficulty}</span>
                  )}
                </div>
              </>
            ) : (
              <div style={{textAlign: 'center', padding: '1rem 0', color: 'var(--text-secondary)'}}>
                <p style={{margin: '0 0 1rem 0', fontSize: '0.9rem'}}>No meal planned</p>
                <button 
                  onClick={() => setEditing(true)}
                  className="btn-primary"
                  style={{minHeight: 'var(--touch-target-sm)', padding: '0.5rem 1rem'}}
                >
                  + Add Meal
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};