-- Migrate products table from single image to array of images
DO $$
BEGIN
    -- Rename image_url to image_urls and change type if it's currently text
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'products' AND column_name = 'image_url' AND data_type = 'text') THEN
        -- Add temp column
        ALTER TABLE public.products ADD COLUMN IF NOT EXISTS image_urls text[] DEFAULT '{}';
        
        -- Migrate data (wrap single URL in array)
        UPDATE public.products SET image_urls = ARRAY[image_url] WHERE image_url IS NOT NULL;
        
        -- Drop old column
        ALTER TABLE public.products DROP COLUMN IF EXISTS image_url;
    END IF;
END $$;

-- Also ensure 'colors' and 'sizes' are text[] which they already are in the schema I saw.
