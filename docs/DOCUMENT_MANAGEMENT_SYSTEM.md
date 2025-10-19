# Document Management System

This document describes the implementation of a comprehensive document management system with S3 integration and Zustand state management.

## Overview

The document management system allows users to:
- Upload documents to S3 storage via Supabase
- Organize documents by type (resume, cover letter, portfolio, etc.)
- View document metadata and verification status
- Download documents with secure signed URLs
- Filter and search through documents
- Update document metadata
- Delete documents (both from S3 and database)

## Database Schema

### Documents Table

```sql
CREATE TABLE public.documents (
  id uuid NOT NULL DEFAULT extensions.uuid_generate_v4(),
  owner_id uuid NOT NULL,
  document_type text NOT NULL,
  file_name text NOT NULL,
  file_path text NOT NULL,
  file_size integer NOT NULL,
  file_type text NOT NULL,
  is_verified boolean NULL DEFAULT false,
  verify_notes text NULL,
  metadata jsonb NULL,
  created_at timestamp with time zone NULL DEFAULT now(),
  updated_at timestamp with time zone NULL DEFAULT now(),
  CONSTRAINT documents_pkey PRIMARY KEY (id),
  CONSTRAINT documents_owner_id_fkey FOREIGN KEY (owner_id) REFERENCES profiles (id)
);
```

### Key Features

- **UUID Primary Key**: Unique identifier for each document
- **Owner Relationship**: Links documents to user profiles
- **Document Type**: Categorizes documents (resume, cover_letter, portfolio, etc.)
- **File Information**: Stores file name, path, size, and type
- **Verification System**: Tracks document verification status and notes
- **Metadata**: JSONB field for flexible document metadata
- **Timestamps**: Automatic creation and update timestamps
- **Row Level Security**: Ensures users can only access their own documents

## Architecture

### State Management (Zustand)

The system uses Zustand for state management with the following store structure:

```javascript
// src/stores/documentsStore.js
const useDocumentsStore = create((set, get) => ({
  // State
  documents: [],
  isLoading: false,
  error: null,
  uploadProgress: 0,
  isUploading: false,
  selectedDocument: null,
  filters: {
    documentType: 'all',
    searchTerm: '',
    isVerified: null
  },
  
  // Actions
  fetchDocuments: async (ownerId) => { /* ... */ },
  uploadDocument: async (file, ownerId, documentType, metadata) => { /* ... */ },
  deleteDocument: async (documentId) => { /* ... */ },
  getDocumentUrl: async (documentId) => { /* ... */ },
  updateDocumentVerification: async (documentId, isVerified, verifyNotes) => { /* ... */ },
  updateDocumentMetadata: async (documentId, metadata) => { /* ... */ }
}));
```

### Hook Integration

```javascript
// src/hooks/candidate/useDocuments.js
export const useDocuments = (ownerId) => {
  // Selectors for optimal performance
  const documents = useDocumentsStore(state => state.documents);
  const isLoading = useDocumentsStore(state => state.isLoading);
  // ... other selectors
  
  // Memoized computed values
  const filteredDocuments = useMemo(() => { /* ... */ }, [documents, filters]);
  const documentStats = useMemo(() => { /* ... */ }, [documents]);
  
  return {
    documents,
    filteredDocuments,
    documentStats,
    // ... actions and utilities
  };
};
```

## S3 Integration

### File Upload Process

1. **File Validation**: Client-side validation for file type and size
2. **Path Generation**: Creates unique file paths: `documents/{ownerId}/{documentType}/{timestamp}.{ext}`
3. **S3 Upload**: Uploads file to Supabase Storage (S3 backend)
4. **Database Record**: Creates document record in PostgreSQL
5. **Error Handling**: Rolls back S3 upload if database insert fails

### Secure File Access

- **Signed URLs**: Generates temporary signed URLs for file access
- **Expiration**: URLs expire after 1 hour for security
- **Access Control**: Row Level Security ensures users can only access their own files

## Components

### DocumentLibrary

Main component for document management with features:
- Document upload with progress tracking
- Search and filtering capabilities
- Document statistics and categorization
- Bulk operations and verification status

### DocumentViewer

Modal component for viewing documents:
- File preview (images, PDFs)
- Document metadata editing
- Download functionality
- Verification status display

### FileUpload

Reusable component for file selection:
- Drag and drop support
- File validation
- Progress tracking
- Error handling

## Usage Examples

### Basic Usage

```javascript
import { useDocuments } from '../hooks/candidate/useDocuments';

const MyComponent = () => {
  const { user } = useAuth();
  const {
    documents,
    uploadDocument,
    deleteDocument,
    getDocumentUrl
  } = useDocuments(user?.id);

  const handleUpload = async (file) => {
    try {
      await uploadDocument(file, 'resume', {
        description: 'My updated resume',
        tags: 'resume, professional, 2024'
      });
    } catch (error) {
      console.error('Upload failed:', error);
    }
  };

  return (
    <DocumentLibrary />
  );
};
```

### Custom Integration

```javascript
// Custom document management
const {
  documents,
  filteredDocuments,
  documentStats,
  uploadDocument,
  setFilters
} = useDocuments(userId);

// Filter documents by type
setFilters({ documentType: 'resume' });

// Get documents by type
const resumeDocuments = documents.filter(doc => doc.document_type === 'resume');

// Upload with custom metadata
await uploadDocument(file, 'certificate', {
  description: 'AWS Certification',
  expiryDate: '2025-12-31',
  issuer: 'Amazon Web Services'
});
```

## Security Features

### Row Level Security (RLS)

```sql
-- Users can only access their own documents
CREATE POLICY "Users can view their own documents" ON public.documents
    FOR SELECT USING (auth.uid() = owner_id);
```

### File Access Control

- Files are stored in user-specific folders
- Signed URLs with expiration
- No direct public access to files
- Automatic cleanup on user deletion

### Data Validation

- File type validation
- File size limits
- Owner ID verification
- Metadata sanitization

## Performance Optimizations

### Database Indexes

```sql
CREATE INDEX documents_owner_id_idx ON public.documents (owner_id);
CREATE INDEX documents_type_idx ON public.documents (document_type);
CREATE INDEX documents_verified_idx ON public.documents (is_verified);
CREATE INDEX documents_created_at_idx ON public.documents (created_at DESC);
```

### State Management

- Selective state subscriptions
- Memoized computed values
- Optimistic updates
- Batch operations

### File Handling

- Lazy loading of document URLs
- Cached signed URLs
- Progressive file uploads
- Background cleanup

## Migration Guide

### Database Setup

1. Run the migration file:
   ```bash
   psql -d your_database -f database/migrations/001_create_documents_table.sql
   ```

2. Create storage bucket in Supabase:
   - Go to Storage in Supabase dashboard
   - Create bucket named 'documents'
   - Set to private (not public)

3. Configure storage policies:
   ```sql
   -- Allow users to upload to their own folder
   CREATE POLICY "Users can upload their own documents" ON storage.objects
       FOR INSERT WITH CHECK (bucket_id = 'documents' AND auth.uid()::text = (storage.foldername(name))[1]);
   ```

### Component Integration

1. Replace existing document components with new ones
2. Update imports to use new hooks
3. Remove old document state management
4. Test file upload and download functionality

## Error Handling

### Common Errors

- **Upload Failed**: Network issues, file size limits, invalid file types
- **Download Failed**: Expired URLs, missing files, permission issues
- **Database Errors**: Constraint violations, connection issues

### Error Recovery

- Automatic retry for network issues
- Graceful degradation for missing files
- User-friendly error messages
- Fallback options for failed operations

## Testing

### Unit Tests

```javascript
// Test document store actions
test('uploadDocument should add document to state', async () => {
  const store = useDocumentsStore.getState();
  const mockFile = new File(['test'], 'test.pdf', { type: 'application/pdf' });
  
  await store.uploadDocument(mockFile, 'user123', 'resume');
  
  expect(store.documents).toHaveLength(1);
  expect(store.documents[0].document_type).toBe('resume');
});
```

### Integration Tests

- Test file upload to S3
- Test database operations
- Test URL generation and access
- Test error scenarios

## Future Enhancements

### Planned Features

- **Document Versioning**: Track document versions and changes
- **Bulk Operations**: Upload/delete multiple documents
- **Document Templates**: Pre-defined document structures
- **OCR Integration**: Extract text from images/PDFs
- **Document Sharing**: Share documents with employers
- **Advanced Search**: Full-text search within documents
- **Document Analytics**: Usage statistics and insights

### Performance Improvements

- **CDN Integration**: Faster file delivery
- **Image Optimization**: Automatic image compression
- **Caching Strategy**: Redis-based caching
- **Background Processing**: Async document processing

## Troubleshooting

### Common Issues

1. **Upload Fails**: Check file size limits and network connection
2. **Download Fails**: Verify signed URL hasn't expired
3. **Permission Denied**: Ensure RLS policies are correctly configured
4. **Storage Quota**: Monitor storage usage and limits

### Debug Tools

- Browser developer tools for network requests
- Supabase dashboard for database queries
- Storage logs for file operations
- Application logs for error tracking

## Support

For issues or questions about the document management system:

1. Check the troubleshooting section
2. Review error logs and network requests
3. Verify database and storage configuration
4. Contact the development team

---

This document management system provides a robust, secure, and scalable solution for handling user documents with full S3 integration and modern state management patterns. 