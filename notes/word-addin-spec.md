# Microsoft Word Add-in Specification

## Overview

The Frith AI Word Add-in provides seamless integration between Microsoft Word and the Frith AI platform, allowing users to:

- Analyze selected text with AI tools
- Generate content using AI assistance
- Insert AI-generated content directly into documents
- Access Frith AI tools without leaving Word

## Files Structure

```
prod/word-addin/
├── manifest.xml          # Add-in manifest file
└── assets/               # Icons and resources

dev/app/word-addin/
├── taskpane/page.tsx     # Main task pane interface
├── functions/page.tsx    # Ribbon command functions
└── help/page.tsx         # Help and documentation
```

## Installation & Development

### Local Development

1. **Start the development server:**
   ```bash
   cd dev
   npm run dev
   ```

2. **Sideload the add-in in Word:**
   
   **Windows:**
   - Open Word
   - Go to Insert > My Add-ins > Upload My Add-in
   - Select `prod/word-addin/manifest.xml`
   
   **Mac:**
   - Open Word
   - Go to Insert > Add-ins > Upload My Add-in
   - Select `prod/word-addin/manifest.xml`
   
   **Word Online:**
   - Go to Insert > Office Add-ins
   - Click "Upload My Add-in"
   - Select the manifest file

### Production Deployment

1. **Update manifest URLs:**
   - Replace `https://your-domain.com` with your actual domain
   - Update all resource URLs to point to production

2. **Deploy to Office Store:**
   - Submit to Microsoft AppSource
   - Follow Microsoft's certification process

## Features

### Task Pane Interface

The main task pane (`/word-addin/taskpane`) provides:

- **Text Selection:** Capture selected text from the document
- **Tool Selection:** Choose from available AI tools
- **Input Context:** Add additional context or instructions
- **Output Display:** View AI-generated results
- **Document Integration:** Insert results back into the document

### Ribbon Commands

- **Frith AI Button:** Opens the task pane
- **Analyze Text Button:** Quick analysis of selected text

### Available Tools

The add-in integrates with these Frith AI tools:

1. **Legal Email Drafter**
   - Draft professional legal emails
   - Category: Communication

2. **Contract Analyzer**
   - Analyze contracts for key terms and risks
   - Category: Analysis

3. **Legal Research Assistant**
   - Research legal topics and precedents
   - Category: Research

## API Integration

### Authentication

The add-in uses the same authentication system as the main Frith AI platform:

- Session-based authentication via cookies
- Automatic login redirect if not authenticated
- Secure token handling

### Tool Execution

Tools are executed via the existing `/api/tools/run` endpoint:

```typescript
const response = await fetch('/api/tools/run', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    toolId: selectedTool,
    input: selectedText,
    additionalContext: additionalInput,
  }),
})
```

## Office.js Integration

### Required Permissions

```xml
<Permissions>ReadWriteDocument</Permissions>
```

### Key APIs Used

- **Text Selection:** `context.document.getSelection()`
- **Text Insertion:** `selection.insertText()`
- **Document Sync:** `context.sync()`

### Error Handling

The add-in includes comprehensive error handling for:

- Office.js initialization failures
- Network connectivity issues
- API errors
- Document access permissions

## Security Considerations

1. **HTTPS Required:** All URLs must use HTTPS in production
2. **Domain Validation:** Only approved domains can be accessed
3. **Content Security Policy:** Implement CSP headers
4. **Data Privacy:** User document content is only sent when explicitly requested

## Testing

### Manual Testing

1. **Text Selection:**
   - Select various types of text in Word
   - Verify text is captured correctly
   - Test with empty selections

2. **Tool Execution:**
   - Test each available tool
   - Verify output formatting
   - Test error scenarios

3. **Document Integration:**
   - Insert generated content
   - Verify formatting preservation
   - Test undo/redo functionality

### Automated Testing

Consider implementing:
- Unit tests for core functions
- Integration tests with Office.js APIs
- End-to-end testing with Word automation

## Troubleshooting

### Common Issues

1. **Add-in not loading:**
   - Check manifest XML syntax
   - Verify all URLs are accessible
   - Check browser console for errors

2. **Office.js errors:**
   - Ensure Word version compatibility
   - Check required permissions
   - Verify API usage patterns

3. **Authentication issues:**
   - Check session cookies
   - Verify CORS settings
   - Test authentication flow

### Debug Mode

Enable debug mode by:
1. Opening browser developer tools
2. Checking console logs
3. Using Office.js debugging features

## Future Enhancements

Planned improvements:

1. **Offline Support:** Cache frequently used tools
2. **Document Templates:** Pre-built legal document templates
3. **Collaboration:** Real-time collaboration features
4. **Advanced Formatting:** Rich text formatting preservation
5. **Custom Tools:** User-defined tool configurations

## Support

For technical support:
- Documentation: `/word-addin/help`
- Email: support@frith.ai
- GitHub Issues: [Repository URL]

## Version History

- **v1.0.0:** Initial release with basic AI tool integration
- **v1.1.0:** (Planned) Enhanced formatting and template support
- **v1.2.0:** (Planned) Offline capabilities and performance improvements
