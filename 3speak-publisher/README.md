# 3Speak Publisher dApp

A DLUX dApp for publishing videos to 3Speak using m3u8 files stored on SPK Network.

## Features

- **Video Preview**: Drag and drop m3u8 files from SPK Network for instant preview
- **HLS Support**: Built-in HLS.js player for streaming video playback
- **Metadata Management**: Complete form for video title, description, tags, and NSFW flag
- **Thumbnail Support**: Capture thumbnails from video or select from SPK files
- **Hive Integration**: Syncs with main post title and description
- **3Speak Compliance**: Generates proper custom_json format with required beneficiaries

## Usage

### As a Standalone dApp

1. Open `index.html` in a web browser
2. Drag an m3u8 file to the drop zone
3. Fill in video metadata
4. Click "Send to Editor" to generate custom JSON

### As a DLUX Editor Integration

When loaded as an iframe in DLUX editor:

1. The dApp receives initial post data (title, body, tags)
2. User drags m3u8 file from SPK Network files
3. Video metadata can sync with post data
4. "Send to Editor" sends formatted data back to parent

## Custom JSON Format

The dApp generates 3Speak-compatible custom JSON:

```json
{
  "app": "3speak/0.3",
  "type": "video",
  "data": {
    "title": "Video Title",
    "description": "Video Description",
    "tags": ["tag1", "tag2"],
    "duration": 120,
    "filesize": 1048576,
    "isNsfwContent": false,
    "thumbnail": "ipfs://QmThumbnailHash",
    "video": {
      "format": "m3u8",
      "url": "ipfs://QmVideoHash/video.m3u8",
      "ipfs": "QmVideoHash"
    }
  }
}
```

## Required Beneficiaries

3Speak requires these beneficiaries:
- `spk.beneficiary`: 9% (900 weight)
- `threespeakleader`: 1% (100 weight)

## Parent Window Communication

### Messages Sent to Parent

```javascript
// Ready signal
{ type: 'ready' }

// Request SPK browser
{ type: 'requestSPKBrowser', fileType: 'm3u8' }

// Publish data
{
  type: 'publish',
  data: {
    customJson: {...},
    beneficiaries: [...],
    metadata: {...}
  }
}
```

### Messages Received from Parent

```javascript
// Initial data
{
  type: 'init',
  title: 'Post Title',
  body: 'Post Body',
  tags: ['tag1', 'tag2']
}

// SPK file selected
{
  type: 'spkFileSelected',
  file: {
    url: 'ipfs://...',
    ipfs: 'QmHash',
    name: 'video.m3u8',
    size: 1048576
  }
}
```

## Development

### Debug Mode

Add `?debug=true` to the URL to show the debug panel with generated JSON.

### File Structure

```
3speak-publisher/
├── index.html      # Main UI
├── app.js         # Application logic
├── style.css      # Styling
└── README.md      # This file
```

## Integration Example

```html
<iframe 
  src="/3speak-publisher/index.html" 
  width="100%" 
  height="800"
  frameborder="0">
</iframe>
```

## Notes

- Videos must be pre-transcoded to m3u8 format
- Files should be stored on SPK Network (IPFS)
- Thumbnail capture requires video to be playing
- All metadata fields follow 3Speak API requirements

## License

Part of the DLUX ecosystem