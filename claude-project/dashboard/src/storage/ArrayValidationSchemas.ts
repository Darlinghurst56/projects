/**
 * Array Validation Schemas for Collections
 * QA Agent Fix - Task 4 TypeScript Issues
 */

import {
  WidgetData,
  UserNote,
  ValidationSchema
} from '../types/index.js';
import { WidgetDataSchema, UserNoteSchema } from './ValidationSchemas.js';

// Array validation schema for WidgetData collections
export const WidgetDataArraySchema: ValidationSchema<WidgetData[]> = {
  validate: (data: unknown): data is WidgetData[] => {
    if (!Array.isArray(data)) return false;
    return data.every(item => WidgetDataSchema.validate(item));
  },
  
  sanitize: (data: unknown): WidgetData[] | null => {
    if (!Array.isArray(data)) return null;
    
    const sanitized = data
      .map(item => WidgetDataSchema.sanitize(item))
      .filter((item): item is WidgetData => item !== null);
    
    return sanitized;
  },
  
  version: '1.0.0'
};

// Array validation schema for UserNote collections
export const UserNoteArraySchema: ValidationSchema<UserNote[]> = {
  validate: (data: unknown): data is UserNote[] => {
    if (!Array.isArray(data)) return false;
    return data.every(item => UserNoteSchema.validate(item));
  },
  
  sanitize: (data: unknown): UserNote[] | null => {
    if (!Array.isArray(data)) return null;
    
    const sanitized = data
      .map(item => UserNoteSchema.sanitize(item))
      .filter((item): item is UserNote => item !== null);
    
    return sanitized;
  },
  
  version: '1.0.0'
};

// Export all array schemas
export const ArrayValidationSchemas = {
  WidgetDataArray: WidgetDataArraySchema,
  UserNoteArray: UserNoteArraySchema
} as const;