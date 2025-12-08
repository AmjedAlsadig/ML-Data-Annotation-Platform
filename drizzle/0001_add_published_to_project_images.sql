-- Migration: Add published column to project_images table
-- This allows marking images as published/locked to prevent further modifications

ALTER TABLE project_images 
ADD COLUMN published BOOLEAN NOT NULL DEFAULT false;

-- Add index for better query performance when filtering by published status
CREATE INDEX idx_project_images_published ON project_images(published);

-- Add comment to document the column purpose
COMMENT ON COLUMN project_images.published IS 'Indicates if the image is published and locked from modifications (annotations, deletion)';
