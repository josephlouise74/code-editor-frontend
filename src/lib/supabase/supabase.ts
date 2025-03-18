import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://ajmhkwiqsnuilsacrxby.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFqbWhrd2lxc251aWxzYWNyeGJ5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Mzk3MTM3NjYsImV4cCI6MjA1NTI4OTc2Nn0.VoBxw4__-fOWPllqQyIzCpCxwh8AjTfdHNvoJG8iY6A';

// Initialize Supabase client
export const supabase = createClient(supabaseUrl, supabaseKey);

// Types
interface UploadImageResponse {
    url: string | null;
    error: string | null;
    filePath: string | null;
}

interface UploadImageOptions {
    file: File;
    customFileName?: string;
    maxSizeMB?: number;
    folder?: string;
}

/**
 * Validates an image file based on type and size constraints.
 */
const validateImage = (file: File, maxSizeMB: number): string | null => {
    // Allowed MIME types for JPG and PNG images.
    const allowedTypes = ['image/jpeg', 'image/png', 'image/jpg'];
    if (!file.type || !allowedTypes.includes(file.type)) {
        return 'Please upload a valid image file (JPG or PNG)';
    }

    // Check file size.
    const maxSizeBytes = maxSizeMB * 1024 * 1024;
    if (file.size > maxSizeBytes) {
        return `File size must be under ${maxSizeMB}MB`;
    }

    return null;
};

/**
 * Returns the file extension based on the MIME type.
 */
const getFileExtension2 = (mimeType: string): string => {
    if (mimeType === 'image/jpeg' || mimeType === 'image/jpg') return '.jpg';
    if (mimeType === 'image/png') return '.png';
    return '';
};


/**
 * Uploads an image file to Supabase Storage.
 */
export const uploadImage = async ({
    file,
    customFileName,
    maxSizeMB = MAX_IMAGE_SIZE_MB, // Uses 10MB as default
    folder = 'images'
}: UploadImageOptions): Promise<UploadImageResponse> => {
    try {
        // Validate the file.
        const validationError = validateImage(file, maxSizeMB);
        if (validationError) {
            return {
                url: null,
                error: validationError,
                filePath: null
            };
        }

        // Generate a unique file name.
        const timestamp = new Date().getTime();
        const sanitizedFileName = customFileName || file.name.replace(/[^a-zA-Z0-9.]/g, '_');
        const fileExtension = getFileExtension2(file.type);
        const finalFileName = `${timestamp}-${sanitizedFileName}${fileExtension}`;

        // Construct the file path.
        const filePath = `${folder}/${finalFileName}`;

        // Upload to Supabase Storage.
        const { error: uploadError } = await supabase.storage
            .from('monkey-images')
            .upload(filePath, file, {
                cacheControl: '3600',
                contentType: file.type,
                upsert: false
            });

        if (uploadError) {
            throw new Error(uploadError.message);
        }

        // Get the public URL.
        const { data: { publicUrl } } = supabase.storage
            .from('monkey-images')
            .getPublicUrl(filePath);

        return {
            url: publicUrl,
            error: null,
            filePath
        };

    } catch (error) {
        console.error('Image upload failed:', error);
        return {
            url: null,
            error: error instanceof Error ? error.message : 'Failed to upload image',
            filePath: null
        };
    }
};



/**
 * Get image download URL
 */
export const getImageDownloadUrl = async (filePath: string): Promise<string | null> => {
    try {
        const { data: { publicUrl } } = supabase.storage
            .from('monkey-images')
            .getPublicUrl(filePath);

        return publicUrl;
    } catch (error) {
        console.error('Error getting download URL:', error);
        return null;
    }
};

/**
 * Simple function to handle image upload
 */
export const handleImageUpload = async (file: File): Promise<string> => {
    try {
        // Validate file is an image
        if (!file.type.match(/image\/(jpeg|jpg|png)/)) {
            throw new Error('Please upload a JPG or PNG image');
        }

        const fileExt = file.name.split('.').pop()?.toLowerCase() ||
            (file.type === 'image/png' ? 'png' : 'jpg');
        const fileName = `${Math.random().toString(36).substring(2)}.${fileExt}`;
        const filePath = `images/${fileName}`;

        const { error: uploadError } = await supabase.storage
            .from('monkey-images')
            .upload(filePath, file, {
                contentType: file.type
            });

        if (uploadError) throw uploadError;

        const { data: { publicUrl } } = supabase.storage
            .from('monkey-images')
            .getPublicUrl(filePath);

        return publicUrl;
    } catch (error) {
        console.error('Upload failed:', error);
        throw error;
    }
};


// Types
export interface LessonData {
    category: 'preschool' | 'teenagers' | 'youngAdults' | 'generalPublic';
    imageUrl: string;
    adminId: string;
    adminRole: string;
    title?: string;
    description?: string;
}

export interface PaginationParams {
    page: number;
    limit: number;
}

export interface PaginatedResponse<T> {
    data: T[];
    pagination: {
        currentPage: number;
        totalPages: number;
        totalItems: number;
    };
}

/**
 * Creates a new lesson in the database
 */
export const createLesson = async (data: LessonData): Promise<any> => {
    try {
        const { data: lesson, error } = await supabase
            .from('lessons')
            .insert([{
                category: data.category,
                image_url: data.imageUrl,
                admin_id: data.adminId,
                admin_role: data.adminRole,
                title: data.title,
                description: data.description,
                created_at: new Date().toISOString(),
            }])
            .select()
            .single();

        if (error) throw error;
        return lesson;
    } catch (error) {
        console.error('Error creating lesson:', error);
        throw error;
    }
};

/**
 * Fetches lessons by category with pagination
 */
export const getLessonsByCategory = async (
    category: LessonData['category'],
    { page = 1, limit = 30 }: PaginationParams
): Promise<PaginatedResponse<any>> => {
    try {
        const from = (page - 1) * limit;
        const to = from + limit - 1;

        const { data, error, count } = await supabase
            .from('lessons')
            .select('*', { count: 'exact' })
            .eq('category', category)
            .order('created_at', { ascending: false })
            .range(from, to);

        if (error) throw error;

        return {
            data: data || [],
            pagination: {
                currentPage: page,
                totalPages: Math.ceil((count || 0) / limit),
                totalItems: count || 0,
            },
        };
    } catch (error) {
        console.error('Error fetching lessons:', error);
        throw error;
    }
};

/**
 * Deletes a lesson by ID
 */
export const deleteLessonById = async (lessonId: string): Promise<void> => {
    try {
        const { error } = await supabase
            .from('lessons')
            .delete()
            .eq('id', lessonId);

        if (error) throw error;
    } catch (error) {
        console.error('Error deleting lesson:', error);
        throw error;
    }
};

/**
 * Uploads a PDF file to Supabase Storage.
 */
export const uploadLessonImage = async (file: File): Promise<string> => {
    try {
        // Validate file type: Only PDF is allowed.
        if (file.type !== "application/pdf") {
            throw new Error("Invalid file type. Please upload a PDF file.");
        }

        const maxSize = MAX_PDF_SIZE_MB * 1024 * 1024; // 50MB limit
        if (file.size > maxSize) {
            throw new Error(`File size exceeds ${MAX_PDF_SIZE_MB}MB limit.`);
        }

        // Generate a unique filename with a .pdf extension.
        const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.pdf`;
        const filePath = `lessons/${fileName}`;

        // Upload the file to Supabase Storage.
        const { error: uploadError } = await supabase.storage
            .from('monkey-images')
            .upload(filePath, file, {
                cacheControl: '3600',
                contentType: file.type,
                upsert: false
            });

        if (uploadError) throw uploadError;

        // Get the public URL for the uploaded PDF.
        const { data: { publicUrl } } = supabase.storage
            .from('monkey-images')
            .getPublicUrl(filePath);

        return publicUrl;
    } catch (error) {
        console.error("PDF upload failed:", error);
        throw error;
    }
};
const MAX_IMAGE_SIZE_MB = 10; // Changed from 50MB to 10MB
const MAX_PDF_SIZE_MB = 50; // Increased to 50MB


/**
 * Uploads a PDF file to Supabase Storage with increased size limit (50MB).
 */
export const uploadLessonPdf = async (file: File): Promise<string> => {
    try {
        // Validate file type: Only PDF is allowed.
        if (file.type !== "application/pdf") {
            throw new Error("Invalid file type. Please upload a PDF file.");
        }

        const maxSize = MAX_PDF_SIZE_MB * 1024 * 1024; // 50MB limit
        if (file.size > maxSize) {
            throw new Error(`File size exceeds ${MAX_PDF_SIZE_MB}MB limit.`);
        }

        // Generate a unique filename with a .pdf extension.
        const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.pdf`;
        const filePath = `lessons/${fileName}`;

        // Upload the file to Supabase Storage.
        const { error: uploadError } = await supabase.storage
            .from('monkey-images')
            .upload(filePath, file, {
                cacheControl: '3600',
                contentType: file.type,
                upsert: false
            });

        if (uploadError) throw uploadError;

        // Get the public URL for the uploaded PDF.
        const { data: { publicUrl } } = supabase.storage
            .from('monkey-images')
            .getPublicUrl(filePath);

        return publicUrl;
    } catch (error) {
        console.error("PDF upload failed:", error);
        throw error;
    }
};
