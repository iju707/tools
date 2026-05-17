# dev_11: Separation of Base64 & Hash and Image to Base64 Tools

## Objectives
- Separate the existing "Base64 & Hash Tool" into two distinct, specialized pages:
  1. **Text-focused Base64 & Hash Encoder (`EncoderTool.tsx`)**
  2. **Dedicated Image to Base64 Converter (`ImageEncoderTool.tsx`)**
- Improve UI navigation by removing tabs and using the sidebar menu for switching between text and image processing.
- Maintain design consistency across the application.

## Implementation Details

### 1. Extracted Image Tool (`src/pages/ImageEncoderTool.tsx`)
- Created a new component `ImageEncoderTool`.
- Moved the Image drag-and-drop, `FileReader` conversion, and layout logic from `EncoderTool` into this new file.
- Ensures a focused UI for converting image files into Data URIs, HTML `<img>` tags, and Raw Base64 strings.

### 2. Refactored Text Encoder Tool (`src/pages/EncoderTool.tsx`)
- Removed the `Tabs` and `CustomTabPanel` components.
- Stripped out all image-related states (`imageSrc`, `imageMeta`, etc.) and event handlers (`handleDrop`, `processFile`, etc.).
- The page now exclusively handles text input for Base64 (Encode/Decode), URL (Encode/Decode), and Hashing (MD5, SHA-1, SHA-256, SHA-512).

### 3. Application Routing & Sidebar Integration (`src/App.tsx`)
- Added `/image-base64` to the application routes, rendering `<ImageEncoderTool />`.
- Updated the sidebar navigation (`navItems`):
  - Retained `Base64 & Hash` (using `SecurityIcon`).
  - Added `Image & Base64` (using `ImageIcon`).

## Next Steps
- Continue adding more developer-centric tools as requested by the user.
- Explore further modularization of common components (e.g., extracting `ResultBox` into a shared UI component).
