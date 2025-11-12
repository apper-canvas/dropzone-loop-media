# ApperFileFieldComponent

A React component that interfaces with ApperSDK for database-integrated file upload functionality.

## Features

- **SDK Integration**: Seamless integration with ApperSDK for file operations
- **Lifecycle Management**: Proper mounting/unmounting with memory leak prevention
- **Format Conversion**: Automatic conversion between API and UI file formats
- **Error Handling**: Comprehensive error handling with user-friendly messages
- **Performance Optimized**: Uses useMemo to prevent unnecessary re-renders
- **Multiple Instances**: Support for multiple uploader instances on the same page
- **Accessibility**: Proper ARIA attributes and keyboard navigation support

## Usage

### Basic Usage

```jsx
import ApperFileFieldComponent from '@/components/atoms/FileUploader';

function MyComponent() {
  const existingFiles = []; // Files from database
  
  return (
    <ApperFileFieldComponent
      elementId="contact-files-123"
      config={{
        fieldKey: 'contact-attachments-field',
        fieldName: 'attachments',
        tableName: 'contacts',
        apperProjectId: import.meta.env.VITE_APPER_PROJECT_ID,
        apperPublicKey: import.meta.env.VITE_APPER_PUBLIC_KEY,
        existingFiles: existingFiles,
        fileCount: existingFiles.length
      }}
      className="my-custom-styles"
    />
  );
}
```

### With Dynamic Data

```jsx
import { useState, useEffect } from 'react';
import ApperFileFieldComponent from '@/components/atoms/FileUploader';

function ContactForm({ contactId }) {
  const [attachments, setAttachments] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Load existing attachments from database
    const loadAttachments = async () => {
      try {
        // Fetch files for this contact
        const files = await contactService.getAttachments(contactId);
        setAttachments(files);
      } catch (error) {
        console.error('Failed to load attachments:', error);
      } finally {
        setLoading(false);
      }
    };

    if (contactId) {
      loadAttachments();
    }
  }, [contactId]);

  if (loading) {
    return <div>Loading...</div>;
  }

  return (
    <div>
      <h2>Contact Attachments</h2>
      <ApperFileFieldComponent
        elementId={`contact-files-${contactId}`}
        config={{
          fieldKey: `contact-${contactId}-attachments`,
          fieldName: 'attachments_c',
          tableName: 'contacts_c',
          apperProjectId: import.meta.env.VITE_APPER_PROJECT_ID,
          apperPublicKey: import.meta.env.VITE_APPER_PUBLIC_KEY,
          existingFiles: attachments,
          fileCount: attachments.length
        }}
      />
    </div>
  );
}
```

## Props

| Prop | Type | Required | Description |
|------|------|----------|-------------|
| `elementId` | string | ✓ | Unique identifier for this uploader instance. Use pattern: `${baseName}-${recordId}` for lists |
| `config` | object | ✓ | Configuration object (see Config Object below) |
| `className` | string | ✗ | CSS classes for styling |
| `style` | object | ✗ | Inline styles object |

### Config Object

| Property | Type | Required | Description |
|----------|------|----------|-------------|
| `fieldKey` | string | ✓ | Unique field identifier across your application |
| `fieldName` | string | ✓ | Database field name with type 'file' |
| `tableName` | string | ✓ | Database table name containing the file field |
| `apperProjectId` | string | ✓ | Your Apper project ID (from environment variables) |
| `apperPublicKey` | string | ✓ | Your Apper public key (from environment variables) |
| `existingFiles` | Array | ✗ | Previously uploaded files to display |
| `fileCount` | number | ✗ | Number of existing files |

## File Formats

The component handles two file formats automatically:

### API Format (from database)
```javascript
{
  Id: 123,
  Name: "document.pdf",
  Size: 1048576,
  Type: "application/pdf", 
  Url: "https://example.com/document.pdf"
}
```

### UI Format (for display)
```javascript
{
  id: 123,
  name: "document.pdf",
  size: 1048576,
  type: "application/pdf",
  url: "https://example.com/document.pdf"
}
```

The component automatically detects and converts between these formats.

## Static Methods

### Format Conversion Utilities

```javascript
import ApperFileFieldComponent from '@/components/atoms/FileUploader';

// Convert API format to UI format
const uiFiles = ApperFileFieldComponent.formatConversion.toUI(apiFiles);

// Check if files are in API format
const isAPI = ApperFileFieldComponent.formatConversion.isAPIFormat(files);

// Check if files are in UI format  
const isUI = ApperFileFieldComponent.formatConversion.isUIFormat(files);
```

## Error Handling

The component provides comprehensive error handling:

- **SDK Loading Errors**: Shows loading state with attempt counter
- **Mount/Unmount Errors**: Graceful degradation with error messages
- **Configuration Errors**: Clear validation messages for missing props
- **File Operation Errors**: User-friendly error messages with retry options

## Performance Considerations

- Uses `useMemo` to prevent unnecessary re-renders when `existingFiles` hasn't actually changed
- Only re-renders when file count changes or first file's ID changes
- Proper cleanup prevents memory leaks in single-page applications
- Optimized SDK availability checking with progressive intervals

## Development Mode

In development, additional debugging methods are available:

```javascript
// Check SDK availability
ApperFileFieldComponent.debug.checkSDK();

// Get instance information
const info = ApperFileFieldComponent.debug.getInstanceInfo('my-element-id');
console.log(info);
```

## Common Patterns

### Multiple Instances
```jsx
// Good: Unique elementIds and fieldKeys
<ApperFileFieldComponent
  elementId="user-avatar-123"
  config={{ fieldKey: 'user-123-avatar', ... }}
/>
<ApperFileFieldComponent  
  elementId="user-documents-123"
  config={{ fieldKey: 'user-123-documents', ... }}
/>
```

### Dynamic Lists
```jsx
{contacts.map(contact => (
  <ApperFileFieldComponent
    key={contact.Id}
    elementId={`contact-files-${contact.Id}`}
    config={{
      fieldKey: `contact-${contact.Id}-attachments`,
      fieldName: 'attachments_c',
      tableName: 'contacts_c',
      // ... other config
      existingFiles: contact.attachments || []
    }}
  />
))}
```

## Troubleshooting

### Component Not Loading
1. Check that `VITE_APPER_SDK_CDN_URL` is set in your environment
2. Verify the SDK script is loaded in `index.html`
3. Check browser console for SDK loading errors

### Files Not Displaying
1. Verify `existingFiles` array format (API vs UI format)
2. Check that `fieldKey` is unique across all instances
3. Ensure `tableName` and `fieldName` match your database schema

### Upload Not Working
1. Confirm `apperProjectId` and `apperPublicKey` are correct
2. Check database permissions for the specified table
3. Verify field type is set to 'file' in your database schema

## Browser Compatibility

- Chrome 80+
- Firefox 75+
- Safari 13+
- Edge 80+

## Dependencies

- React 16.8+ (for hooks)
- ApperSDK (loaded via CDN)
- Tailwind CSS (for default styling)