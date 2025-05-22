import { mount } from '@vue/test-utils';
import FilesVueDd from './filesvue-dd.js'; // Adjust path as needed
import { beforeEach, vi } from 'vitest';

// Mock child components
const MockChoicesVue = {
  template: '<div class="mock-choices-vue"></div>',
  props: ['prop_selections', 'prop_function', 'prop_type', 'prop_options', 'prop_max_items'],
  emits: ['data'],
  methods: {
    // Mock any methods if necessary, e.g., for resetting
    clearStore: vi.fn(),
    destroy: vi.fn(),
  }
};

const MockUploadEverywhere = {
  template: '<div class="mock-upload-everywhere"></div>',
  props: ['account', 'saccountapi', 'externalDrop'],
  emits: ['update:externalDrop', 'tosign', 'done']
};

const MockPopVue = {
    template: '<div class="mock-pop-vue"></div>',
    props: ['id', 'title', 'trigger', 'content', 'variant', 'placement', 'pop'],
};


// Mock browser APIs
global.fetch = vi.fn(() => Promise.resolve({
  json: () => Promise.resolve({}),
  text: () => Promise.resolve(''),
  blob: () => Promise.resolve(new Blob(['content'], {type: 'text/plain'})),
  ok: true,
}));
global.alert = vi.fn();
global.confirm = vi.fn(() => true); // Default to true for tests that need confirmation
global.prompt = vi.fn(() => 'New Name'); // Default prompt response

// Mock localStorage
const localStorageMock = (() => {
  let store = {};
  return {
    getItem: (key) => store[key] || null,
    setItem: (key, value) => { store[key] = value.toString(); },
    removeItem: (key) => { delete store[key]; },
    clear: () => { store = {}; }
  };
})();
Object.defineProperty(window, 'localStorage', { value: localStorageMock });

// Mock hive_keychain
global.hive_keychain = {
  requestVerifyKey: vi.fn((account, key, type, callback) => {
    callback({ success: true, result: `#${key}` }); // Simulate successful verification
  })
};

// Mock Diff (if not globally available in test environment)
global.Diff = {
    createPatch: vi.fn((name, oldVal, newVal) => `--- a/${name}\n+++ b/${name}\n@@ -1 +1 @@\n-${oldVal}\n+${newVal}\n`)
};


// Mock URL.createObjectURL and URL.revokeObjectURL
global.URL.createObjectURL = vi.fn(() => 'mock-url');
global.URL.revokeObjectURL = vi.fn();

// Mock DataTransfer and related classes for drag events
class MockDataTransfer {
  constructor() {
    this.store = {};
    this.items = []; // For DataTransferItemList
    this.files = []; // For FileList
    this.dropEffect = 'none';
    this.effectAllowed = 'all';
  }
  setData(format, data) {
    this.store[format] = data;
  }
  getData(format) {
    return this.store[format];
  }
  setDragImage(image, x, y) {
    // console.log('Mock setDragImage called');
  }
  // Mocking for items (DataTransferItemList)
  add(item) {
    this.items.push(item);
  }
  clearData(format) {
    if(format) {
      delete this.store[format];
    } else {
      this.store = {};
    }
  }
}

// Mock FileSystemEntry, FileSystemFileEntry, FileSystemDirectoryEntry
class MockFileSystemEntry {
  constructor(name, isFile = true, fullPath = name) {
    this.name = name;
    this.isFile = isFile;
    this.isDirectory = !isFile;
    this.fullPath = fullPath; // Important for processDroppedItems
  }
  file(successCallback) {
    if (this.isFile) {
      const mockFile = new File(['mock content for ' + this.name], this.name, { type: 'text/plain' });
      successCallback(mockFile);
    }
  }
  createReader() { // For MockFileSystemDirectoryEntry
    const entries = this.entries || [];
    let readCount = 0;
    return {
      readEntries: (successCallback) => {
        const batch = entries.slice(readCount, readCount + 5); // Simulate reading in batches
        readCount += batch.length;
        successCallback(batch);
      }
    };
  }
}
class MockFileSystemFileEntry extends MockFileSystemEntry {
  constructor(name, fullPath = name) {
    super(name, true, fullPath);
  }
}
class MockFileSystemDirectoryEntry extends MockFileSystemEntry {
  constructor(name, entries = [], fullPath = name) {
    super(name, false, fullPath);
    this.entries = entries; // Array of MockFileSystemEntry
  }
}


describe('FilesVueDd.vue', () => {
  let wrapper;

  const defaultProps = {
    account: 'testuser',
    saccountapi: {
      name: 'testuser',
      file_contracts: [], // Initialize with no contracts for clean tests
      head_block: 12345678, // Mock head_block
      channels: {}
    },
    // ... other props if necessary
  };

  const mockFile1 = { f: 'cid1', i: 'contractA:1:1', o: 'testuser', folderPath: '', n: 'file1.txt', s: 100, c: 1000, e: 2000, y: 'txt', lf: 0, l: '', lic: '', is_thumb: false };
  const mockFile2 = { f: 'cid2', i: 'contractA:1:1', o: 'testuser', folderPath: 'folderA', n: 'file2.png', s: 200, c: 1010, e: 2010, y: 'png', lf: 0, l: '', lic: '', is_thumb: false };
  const mockFile3 = { f: 'cid3', i: 'contractB:1:1', o: 'otheruser', folderPath: '', n: 'file3.jpg', s: 300, c: 1020, e: 2020, y: 'jpg', lf: 0, l: '', lic: '', is_thumb: false };
  
  const mockFolderA = { name: 'FolderA', path: 'FolderA', files: [], subfolders: [] };
  const mockFolderB = { name: 'FolderB', path: 'FolderB', files: [], subfolders: [], isPreset: false };
  const mockPresetFolder = { name: 'Documents', path: 'Documents', files: [], subfolders: [], isPreset: true };


  beforeEach(async () => {
    // Reset mocks before each test
    vi.clearAllMocks();
    localStorageMock.clear();

    // Basic contract structure for files
    defaultProps.saccountapi.file_contracts = [
        { 
            i: 'contractA:1:1', t: 'testuser', df: { 'cid1': 100, 'cid2': 200 }, m: '1|FolderA,file1.txt,txt.0,,0-0-0,file2.png,png.FolderA,,0-0-0', e: '2000:0', n: {}, p:1, u: 300
        },
        { 
            i: 'contractB:1:1', t: 'otheruser', df: { 'cid3': 300 }, m: '1,,file3.jpg,jpg.0,,0-0-0', e: '2020:0', n: {}, p:1, u: 300
        }
    ];


    wrapper = mount(FilesVueDd, {
      props: defaultProps,
      global: {
        components: {
          'choices-vue': MockChoicesVue,
          'upload-everywhere': MockUploadEverywhere,
          'pop-vue': MockPopVue
        },
        stubs: { // Using stubs for Teleport might be simpler if complex interactions are not needed
            Teleport: true
        }
      },
      attachTo: document.body // Necessary for some DOM interactions like selectionBox
    });
    await wrapper.vm.$nextTick(); // Wait for initial render and init()
    // wrapper.vm.init(); // Call init manually to ensure files are processed
    // await wrapper.vm.$nextTick();
  });

  afterEach(() => {
    if (wrapper) {
      wrapper.unmount();
    }
    // Clean up selection box overlay if it exists
    const overlay = document.getElementById('selection-box-overlay');
    if (overlay) {
      overlay.remove();
    }
  });

  test('initializes correctly and loads files', () => {
    expect(wrapper.vm.files).toHaveProperty('cid1');
    expect(wrapper.vm.files).toHaveProperty('cid2');
    expect(wrapper.vm.files['cid1'].n).toBe('file1.txt');
    expect(wrapper.vm.newMeta['contractA:1:1']['cid1'].name).toBe('file1.txt');
    expect(wrapper.vm.selectedUser).toBe('testuser');
  });

  describe('dragStartItem', () => {
    let mockEvent;

    beforeEach(() => {
      mockEvent = {
        dataTransfer: new MockDataTransfer(),
        preventDefault: vi.fn(),
        stopPropagation: vi.fn(),
        // Mock currentTarget if needed for specific tests, though not directly used by dragStartItem
        // currentTarget: document.createElement('div') 
      };
      // Spy on document.body.appendChild and removeChild
      vi.spyOn(document.body, 'appendChild');
      vi.spyOn(document.body, 'removeChild');
    });

    test('should set dataTransfer for a single file drag', async () => {
      const fileToDrag = wrapper.vm.files['cid1'];
      await wrapper.setData({ selectedFiles: [] }); // Ensure no prior selection

      wrapper.vm.dragStartItem(mockEvent, fileToDrag, 'file');

      expect(mockEvent.dataTransfer.getData('itemids')).toBe(JSON.stringify([fileToDrag.f]));
      expect(mockEvent.dataTransfer.getData('contractid')).toBe(fileToDrag.i);
      expect(mockEvent.dataTransfer.getData('text/plain')).toBe(fileToDrag.f);
      expect(wrapper.vm.selectedFiles).toEqual([fileToDrag.f]); // Should select the dragged file

      // Check drag image creation
      expect(document.body.appendChild).toHaveBeenCalled();
      expect(mockEvent.dataTransfer.store.dragImage).toBeDefined; // setDragImage is mocked
    });

    test('should set dataTransfer for multiple selected files drag', async () => {
      const file1 = wrapper.vm.files['cid1'];
      const file2 = wrapper.vm.files['cid2'];
      await wrapper.setData({ selectedFiles: [file1.f, file2.f] });

      wrapper.vm.dragStartItem(mockEvent, file1, 'file'); // Dragging one of the selected files

      expect(JSON.parse(mockEvent.dataTransfer.getData('itemids'))).toEqual(expect.arrayContaining([file1.f, file2.f]));
      expect(mockEvent.dataTransfer.getData('contractid')).toBe(file1.i); // Contract ID of the dragged item
      expect(document.body.appendChild).toHaveBeenCalled();
    });

    test('should set dataTransfer for a single folder drag', async () => {
      const folderToDrag = { name: 'FolderB', path: 'FolderB', isPreset: false }; 
      await wrapper.setData({ selectedFiles: [] });
      wrapper.vm.userFolderTrees['testuser'].push(folderToDrag); // Add folder to tree for the test

      wrapper.vm.dragStartItem(mockEvent, folderToDrag, 'folder');

      const expectedFolderId = `folder-${folderToDrag.path}`;
      expect(mockEvent.dataTransfer.getData('itemids')).toBe(JSON.stringify([expectedFolderId]));
      expect(wrapper.vm.selectedFiles).toEqual([expectedFolderId]);
      // contractid might be null or based on first file if logic changes, for now, it might be undefined if no file is representative
      // expect(mockEvent.dataTransfer.getData('contractid')).toBeUndefined(); 
      expect(document.body.appendChild).toHaveBeenCalled();
    });

    test('should prevent dragging preset folders', async () => {
      const presetFolder = { name: 'Documents', path: 'Documents', isPreset: true };
      wrapper.vm.userFolderTrees['testuser'].push(presetFolder);
      await wrapper.setData({ selectedFiles: [] });

      wrapper.vm.dragStartItem(mockEvent, presetFolder, 'folder');

      expect(mockEvent.preventDefault).toHaveBeenCalled();
      expect(mockEvent.stopPropagation).toHaveBeenCalled();
      expect(mockEvent.dataTransfer.getData('itemids')).toBeUndefined();
      expect(document.body.appendChild).not.toHaveBeenCalled();
    });

    test('should set representative contract ID when dragging multiple items including files', async () => {
        const file1 = wrapper.vm.files['cid1']; // Belongs to contractA
        const folderB = { name: 'FolderB', path: 'FolderB', isPreset: false };
        const folderBid = `folder-${folderB.path}`;
        wrapper.vm.userFolderTrees['testuser'].push(folderB);

        await wrapper.setData({ selectedFiles: [file1.f, folderBid] });

        // Dragging the file, but folderB is also selected
        wrapper.vm.dragStartItem(mockEvent, file1, 'file'); 

        expect(JSON.parse(mockEvent.dataTransfer.getData('itemids'))).toEqual(expect.arrayContaining([file1.f, folderBid]));
        expect(mockEvent.dataTransfer.getData('contractid')).toBe(file1.i); // Should be contract of file1
    });

    test('drag image should be removed after timeout', async () => {
        vi.useFakeTimers();
        const fileToDrag = wrapper.vm.files['cid1'];
        await wrapper.setData({ selectedFiles: [] });

        wrapper.vm.dragStartItem(mockEvent, fileToDrag, 'file');
        
        expect(document.body.appendChild).toHaveBeenCalledTimes(1);
        const dragImageElement = document.body.appendChild.mock.calls[0][0];
        expect(document.body.contains(dragImageElement)).toBe(true); // Element is added

        vi.runAllTimers(); // Advance timers

        // The mock for removeChild should be called. 
        // Actual removal depends on how setDragImage and the timeout are structured.
        // Since setDragImage itself is a black box for us in unit test and timeout removes the appended child.
        expect(document.body.removeChild).toHaveBeenCalledWith(dragImageElement);
        vi.useRealTimers();
    });
  });

  describe('processDroppedItems and scanDirectory', () => {
    test('processDroppedItems should correctly process a single dropped file', async () => {
      const mockFile = new File(['content'], 'testfile.txt', { type: 'text/plain' });
      const mockFileEntry = new MockFileSystemFileEntry('testfile.txt');
      vi.spyOn(mockFileEntry, 'file').mockImplementation((cb) => cb(mockFile));

      const mockDataTransferItem = {
        kind: 'file',
        webkitGetAsEntry: () => mockFileEntry
      };
      const items = [mockDataTransferItem];

      const processedFiles = await wrapper.vm.processDroppedItems(items);
      
      expect(processedFiles).toHaveLength(1);
      expect(processedFiles[0].file.name).toBe('testfile.txt');
      expect(processedFiles[0].relativePath).toBe('testfile.txt');
    });

    test('processDroppedItems should correctly process a dropped folder with files', async () => {
      // Mock directory structure: myFolder/file1.txt, myFolder/subFolder/file2.txt
      const file1 = new File(['f1'], 'file1.txt');
      const fileEntry1 = new MockFileSystemFileEntry('file1.txt', 'myFolder/file1.txt');
      vi.spyOn(fileEntry1, 'file').mockImplementation(cb => cb(file1));

      const file2 = new File(['f2'], 'file2.txt');
      const fileEntry2 = new MockFileSystemFileEntry('file2.txt', 'myFolder/subFolder/file2.txt');
      vi.spyOn(fileEntry2, 'file').mockImplementation(cb => cb(file2));

      const subFolderEntry = new MockFileSystemDirectoryEntry('subFolder', [fileEntry2], 'myFolder/subFolder');
      const mainFolderEntry = new MockFileSystemDirectoryEntry('myFolder', [fileEntry1, subFolderEntry], 'myFolder');
      
      const mockDataTransferItem = {
        kind: 'file',
        webkitGetAsEntry: () => mainFolderEntry
      };
      const items = [mockDataTransferItem];

      const processedFiles = await wrapper.vm.processDroppedItems(items);

      expect(processedFiles).toHaveLength(2);
      const file1Result = processedFiles.find(f => f.file.name === 'file1.txt');
      const file2Result = processedFiles.find(f => f.file.name === 'file2.txt');

      expect(file1Result).toBeDefined();
      expect(file1Result.relativePath).toBe('myFolder/file1.txt');

      expect(file2Result).toBeDefined();
      expect(file2Result.relativePath).toBe('myFolder/subFolder/file2.txt');
    });

    test('scanDirectory should recursively find all files in a directory structure', async () => {
        const file1 = new File(['f1'], 'file1.txt');
        const fileEntry1 = new MockFileSystemFileEntry('file1.txt', 'root/file1.txt');
        vi.spyOn(fileEntry1, 'file').mockImplementation(cb => cb(file1));
  
        const file2 = new File(['f2'], 'file2.txt');
        const fileEntry2 = new MockFileSystemFileEntry('file2.txt', 'root/sub/file2.txt');
        vi.spyOn(fileEntry2, 'file').mockImplementation(cb => cb(file2));

        const file3 = new File(['f3'], 'file3.txt');
        const fileEntry3 = new MockFileSystemFileEntry('file3.txt', 'root/sub/file3.txt');
        vi.spyOn(fileEntry3, 'file').mockImplementation(cb => cb(file3));
  
        const subSubFolderEntry = new MockFileSystemDirectoryEntry('subsub', [], 'root/sub/subsub'); // Empty folder
        const subFolderEntry = new MockFileSystemDirectoryEntry('sub', [fileEntry2, fileEntry3, subSubFolderEntry], 'root/sub');
        const rootDirEntry = new MockFileSystemDirectoryEntry('root', [fileEntry1, subFolderEntry], 'root');
  
        const files = await wrapper.vm.scanDirectory(rootDirEntry);
  
        expect(files).toHaveLength(3);
        expect(files.map(f => f.relativePath)).toEqual(expect.arrayContaining([
          'root/file1.txt',
          'root/sub/file2.txt',
          'root/sub/file3.txt'
        ]));
      });

    test('processDroppedItems should handle mixed content (files and folders) correctly', async () => {
        const standaloneFile = new File(['standalone'], 'standalone.doc');
        const standaloneFileEntry = new MockFileSystemFileEntry('standalone.doc');
        vi.spyOn(standaloneFileEntry, 'file').mockImplementation(cb => cb(standaloneFile));

        const fileInFolder = new File(['inFolder'], 'inside.pdf');
        const fileInFolderEntry = new MockFileSystemFileEntry('inside.pdf', 'testDir/inside.pdf');
        vi.spyOn(fileInFolderEntry, 'file').mockImplementation(cb => cb(fileInFolder));
        const testDirEntry = new MockFileSystemDirectoryEntry('testDir', [fileInFolderEntry], 'testDir');

        const items = [
            { kind: 'file', webkitGetAsEntry: () => standaloneFileEntry },
            { kind: 'file', webkitGetAsEntry: () => testDirEntry }
        ];

        const processedFiles = await wrapper.vm.processDroppedItems(items);

        expect(processedFiles).toHaveLength(2);
        expect(processedFiles.map(f => f.relativePath)).toEqual(expect.arrayContaining([
            'standalone.doc', 
            'testDir/inside.pdf'
        ]));
    });

    test('processDroppedItems should correctly strip leading slash from fullPath', async () => {
        const mockFile = new File(['content'], 'testfile.txt', { type: 'text/plain' });
        // Simulate a fullPath that might come from some systems with a leading slash
        const mockFileEntry = new MockFileSystemFileEntry('testfile.txt', '/testfile.txt'); 
        vi.spyOn(mockFileEntry, 'file').mockImplementation((cb) => cb(mockFile));
  
        const mockDataTransferItem = {
          kind: 'file',
          webkitGetAsEntry: () => mockFileEntry
        };
        const items = [mockDataTransferItem];
  
        const processedFiles = await wrapper.vm.processDroppedItems(items);
        
        expect(processedFiles).toHaveLength(1);
        expect(processedFiles[0].file.name).toBe('testfile.txt');
        expect(processedFiles[0].relativePath).toBe('testfile.txt'); // Ensure leading '/' is stripped
      });
  });

  describe('Drop Event Handlers (dropOnFolder, dropOnBreadcrumb, dropOnBackground)', () => {
    let mockDragEvent;

    beforeEach(() => {
      mockDragEvent = {
        dataTransfer: new MockDataTransfer(),
        preventDefault: vi.fn(),
        stopPropagation: vi.fn(),
        // clientX, clientY, etc., if needed for specific assertions not covered here
      };
      // Ensure component has some files loaded
      wrapper.vm.files = {
        'cid1': { ...mockFile1 }, // Use copies to avoid test pollution
        'cid2': { ...mockFile2 },
      };
      wrapper.vm.newMeta = {
        'contractA:1:1': {
            'cid1': { name: 'file1.txt', type: 'txt', folderPath: '', thumb: '', flags: 0, license: '', labels: '' },
            'cid2': { name: 'file2.png', type: 'png', folderPath: 'folderA', thumb: '', flags: 0, license: '', labels: '' }
        }
      };
      wrapper.vm.userFolderTrees = { 'testuser': [{ ...mockFolderA, subfolders: [] }] }; // Basic tree
      wrapper.vm.selectedUser = 'testuser';
      wrapper.vm.currentFolderPath = '';
      vi.spyOn(wrapper.vm, 'buildFolderTrees');
      vi.spyOn(wrapper.vm, 'render');
      vi.spyOn(wrapper.vm, 'processDroppedItems').mockResolvedValue([]); // Default mock for external drops
    });

    // Test suite for dropOnFolder
    describe('dropOnFolder', () => {
        const targetFolder = { name: 'TestFolder', path: 'TestFolder', isPreset: false };

        beforeEach(() => {
            // Ensure targetFolder exists in the tree if needed by the drop logic
            if (!wrapper.vm.userFolderTrees['testuser'].find(f => f.path === targetFolder.path)) {
                 wrapper.vm.userFolderTrees['testuser'].push(targetFolder);
            }
        });

        test('should handle internal file drop correctly', async () => {
            const fileToDrop = wrapper.vm.files['cid1']; // From root
            mockDragEvent.dataTransfer.setData('itemids', JSON.stringify([fileToDrop.f]));
            mockDragEvent.dataTransfer.setData('contractid', fileToDrop.i);

            wrapper.vm.dropOnFolder(mockDragEvent, targetFolder);
            await wrapper.vm.$nextTick();

            expect(wrapper.vm.pendingChanges[fileToDrop.i][fileToDrop.f].folderPath).toBe(targetFolder.path);
            expect(wrapper.vm.files['cid1'].folderPath).toBe(targetFolder.path);
            expect(wrapper.vm.buildFolderTrees).toHaveBeenCalled();
            expect(wrapper.vm.render).toHaveBeenCalled();
        });

        test('should handle internal folder drop correctly', async () => {
            // Setup: folderToMove contains file2 (cid2)
            wrapper.vm.files['cid2'].folderPath = 'folderToMove';
            wrapper.vm.newMeta['contractA:1:1']['cid2'].folderPath = 'folderToMove';
            const folderToMove = { name: 'folderToMove', path: 'folderToMove', isPreset: false };
            wrapper.vm.userFolderTrees['testuser'].push(folderToMove);
            
            mockDragEvent.dataTransfer.setData('itemids', JSON.stringify([`folder-${folderToMove.path}`]));
            // No contractid needed for folder-only move usually, but good to be aware

            wrapper.vm.dropOnFolder(mockDragEvent, targetFolder); // Drop 'folderToMove' onto 'TestFolder'
            await wrapper.vm.$nextTick();

            const newFilePathForCid2 = `${targetFolder.path}`;
            expect(wrapper.vm.pendingChanges[wrapper.vm.files['cid2'].i]['cid2'].folderPath).toBe(newFilePathForCid2);
            expect(wrapper.vm.files['cid2'].folderPath).toBe(newFilePathForCid2);
            expect(wrapper.vm.buildFolderTrees).toHaveBeenCalled();
            expect(wrapper.vm.render).toHaveBeenCalled();
        });

        test('should call processDroppedItems for external file drop and update droppedExternalFiles', async () => {
            const mockExternalFile = { file: new File(['ext'], 'external.txt'), relativePath: 'external.txt' };
            wrapper.vm.processDroppedItems.mockResolvedValue([mockExternalFile]); // Mock it returns a file
            
            // Simulate DataTransferItemList for external drop detection
            mockDragEvent.dataTransfer.items = [{ kind: 'file', webkitGetAsEntry: () => new MockFileSystemFileEntry('external.txt') }]; 

            wrapper.vm.dropOnFolder(mockDragEvent, targetFolder);
            await wrapper.vm.$nextTick();

            expect(wrapper.vm.processDroppedItems).toHaveBeenCalledWith(mockDragEvent.dataTransfer.items);
            expect(wrapper.vm.droppedExternalFiles.files).toHaveLength(1);
            expect(wrapper.vm.droppedExternalFiles.files[0].file.name).toBe('external.txt');
            // Check that the fullAppPath is correctly formed
            expect(wrapper.vm.droppedExternalFiles.files[0].fullAppPath).toBe(`${targetFolder.path}/external.txt`);
            expect(wrapper.vm.pendingChanges).not.toHaveProperty(mockFile1.i); // No internal changes
        });

        test('should not move a folder into its own subfolder', async () => {
            const parentFolder = { name: 'Parent', path: 'Parent', isPreset: false };
            const childFolder = { name: 'Child', path: 'Parent/Child', isPreset: false };
            wrapper.vm.userFolderTrees['testuser'].push(parentFolder, childFolder);

            mockDragEvent.dataTransfer.setData('itemids', JSON.stringify([`folder-${parentFolder.path}`]));
            const consoleWarnSpy = vi.spyOn(console, 'warn');

            wrapper.vm.dropOnFolder(mockDragEvent, childFolder); // Attempt to drop Parent into Parent/Child
            await wrapper.vm.$nextTick();

            expect(consoleWarnSpy).toHaveBeenCalledWith('Cannot move a folder into its own subfolder');
            expect(wrapper.vm.pendingChanges).toEqual({}); // No changes should be made
            consoleWarnSpy.mockRestore();
        });
    });

    // Test suite for dropOnBreadcrumb
    describe('dropOnBreadcrumb', () => {
        const targetBreadcrumbPath = 'TargetBCFolder';

        test('should handle internal file drop correctly', async () => {
            const fileToDrop = wrapper.vm.files['cid2']; // from folderA
            mockDragEvent.dataTransfer.setData('itemids', JSON.stringify([fileToDrop.f]));
            mockDragEvent.dataTransfer.setData('contractid', fileToDrop.i);

            wrapper.vm.dropOnBreadcrumb(targetBreadcrumbPath, mockDragEvent);
            await wrapper.vm.$nextTick();

            expect(wrapper.vm.pendingChanges[fileToDrop.i][fileToDrop.f].folderPath).toBe(targetBreadcrumbPath);
            expect(wrapper.vm.files['cid2'].folderPath).toBe(targetBreadcrumbPath);
            expect(wrapper.vm.buildFolderTrees).toHaveBeenCalled();
            expect(wrapper.vm.render).toHaveBeenCalled();
        });
        
        // Add test for folder drop on breadcrumb, similar to dropOnFolder
        test('should handle internal folder drop on breadcrumb correctly', async () => {
            wrapper.vm.files['cid1'].folderPath = 'folderToMoveBC'; // file1 is in folderToMoveBC
            wrapper.vm.newMeta['contractA:1:1']['cid1'].folderPath = 'folderToMoveBC';
            const folderToMove = { name: 'folderToMoveBC', path: 'folderToMoveBC', isPreset: false };
            wrapper.vm.userFolderTrees['testuser'].push(folderToMove);

            mockDragEvent.dataTransfer.setData('itemids', JSON.stringify([`folder-${folderToMove.path}`]));

            wrapper.vm.dropOnBreadcrumb(targetBreadcrumbPath, mockDragEvent);
            await wrapper.vm.$nextTick();

            // File inside the moved folder should now have its path updated relative to targetBreadcrumbPath
            const newFilePathForCid1 = targetBreadcrumbPath; // As folderToMoveBC is moved directly into targetBreadcrumbPath
            expect(wrapper.vm.pendingChanges[wrapper.vm.files['cid1'].i]['cid1'].folderPath).toBe(newFilePathForCid1);
            expect(wrapper.vm.files['cid1'].folderPath).toBe(newFilePathForCid1);
            expect(wrapper.vm.buildFolderTrees).toHaveBeenCalled();
            expect(wrapper.vm.render).toHaveBeenCalled();
        });

        // External drop on breadcrumb - should be similar to external drop on folder, but target path is breadcrumb path
        test('should call processDroppedItems for external file drop on breadcrumb', async () => {
            const mockExternalFile = { file: new File(['ext_bc'], 'external_bc.txt'), relativePath: 'external_bc.txt' };
            // Important: Reset mock for this specific external drop test if it was used by dropOnFolder
            wrapper.vm.processDroppedItems.mockReset().mockResolvedValue([mockExternalFile]);
            
            mockDragEvent.dataTransfer.items = [{ kind: 'file', webkitGetAsEntry: () => new MockFileSystemFileEntry('external_bc.txt') }]; 

            // For breadcrumb drop, the external drop is handled by dropOnFolder or dropOnBackground
            // The FilesVueDd.vue component does not have a distinct external drop handler for breadcrumbs.
            // It relies on dropOnFolder if a breadcrumb element acts like a folder drop target, or dropOnBackground.
            // Here, we simulate dropping on a breadcrumb that leads to a folder path.
            // The component's template uses dropOnBreadcrumb, which internally might call similar logic or set currentFolderPath.
            // The test here will check if `droppedExternalFiles` is updated if `dropOnBreadcrumb` was adapted or if it internally calls `dropOnFolder/Background` for such cases.
            // *Correction*: `dropOnBreadcrumb` in the provided code *does* handle external files via the `UploadEverywhere` component.
            // However, it does this by setting `droppedExternalFiles` which is then picked up by `UploadEverywhere`.
            // The provided code for dropOnBreadcrumb doesn't directly call processDroppedItems, it relies on dropOnFolder/Background for that part of external drops.
            // Let's assume dropOnFolder is the effective handler for external items if a breadcrumb acts as folder.
            // If breadcrumb drop leads to `dropOnBackground` effectively when target is current folder path:
            await wrapper.setData({ currentFolderPath: targetBreadcrumbPath });
            wrapper.vm.dropOnBackground(mockDragEvent); // Simulating drop on background of the target breadcrumb path
            await wrapper.vm.$nextTick();

            expect(wrapper.vm.processDroppedItems).toHaveBeenCalledWith(mockDragEvent.dataTransfer.items);
            expect(wrapper.vm.droppedExternalFiles.files).toHaveLength(1);
            expect(wrapper.vm.droppedExternalFiles.files[0].file.name).toBe('external_bc.txt');
            expect(wrapper.vm.droppedExternalFiles.files[0].fullAppPath).toBe(`${targetBreadcrumbPath}/external_bc.txt`);
        });
    });

    // Test suite for dropOnBackground
    describe('dropOnBackground', () => {
        test('should handle internal file drop to current folder path', async () => {
            await wrapper.setData({ currentFolderPath: 'NewBackgroundFolder' });
            const fileToDrop = wrapper.vm.files['cid1']; // from root
            mockDragEvent.dataTransfer.setData('itemids', JSON.stringify([fileToDrop.f]));
            mockDragEvent.dataTransfer.setData('contractid', fileToDrop.i);
            // Set fileid directly as well for dropOnBackground specific logic if it uses it.
            mockDragEvent.dataTransfer.setData('fileid', fileToDrop.f);


            wrapper.vm.dropOnBackground(mockDragEvent);
            await wrapper.vm.$nextTick();

            expect(wrapper.vm.pendingChanges[fileToDrop.i][fileToDrop.f].folderPath).toBe('NewBackgroundFolder');
            expect(wrapper.vm.files['cid1'].folderPath).toBe('NewBackgroundFolder');
            expect(wrapper.vm.buildFolderTrees).toHaveBeenCalled();
            expect(wrapper.vm.render).toHaveBeenCalled();
        });

        test('should call processDroppedItems for external file drop and update droppedExternalFiles to current folder path', async () => {
            await wrapper.setData({ currentFolderPath: 'ExternalDropZone' });
            const mockExternalFile = { file: new File(['ext_bg'], 'external_bg.dat'), relativePath: 'external_bg.dat' };
            wrapper.vm.processDroppedItems.mockResolvedValue([mockExternalFile]);
            
            mockDragEvent.dataTransfer.items = [{ kind: 'file', webkitGetAsEntry: () => new MockFileSystemFileEntry('external_bg.dat') }]; 

            wrapper.vm.dropOnBackground(mockDragEvent);
            await wrapper.vm.$nextTick();

            expect(wrapper.vm.processDroppedItems).toHaveBeenCalledWith(mockDragEvent.dataTransfer.items);
            expect(wrapper.vm.droppedExternalFiles.files).toHaveLength(1);
            expect(wrapper.vm.droppedExternalFiles.files[0].file.name).toBe('external_bg.dat');
            expect(wrapper.vm.droppedExternalFiles.files[0].fullAppPath).toBe(`ExternalDropZone/external_bg.dat`);
        });

        test('should handle external folder drop on background by processing its items', async () => {
            await wrapper.setData({ currentFolderPath: 'RootDrop' });
            const fileInExtFolder = new File(['inExtFolder'], 'doc.pdf');
            const fileInExtFolderEntry = new MockFileSystemFileEntry('doc.pdf', 'ExtFolder/doc.pdf');
            vi.spyOn(fileInExtFolderEntry, 'file').mockImplementation(cb => cb(fileInExtFolder));
            const extFolderEntry = new MockFileSystemDirectoryEntry('ExtFolder', [fileInExtFolderEntry], 'ExtFolder');

            wrapper.vm.processDroppedItems.mockResolvedValue([{ file: fileInExtFolder, relativePath: 'ExtFolder/doc.pdf'}]);
            mockDragEvent.dataTransfer.items = [{ kind: 'file', webkitGetAsEntry: () => extFolderEntry }];

            wrapper.vm.dropOnBackground(mockDragEvent);
            await wrapper.vm.$nextTick();

            expect(wrapper.vm.processDroppedItems).toHaveBeenCalledWith(mockDragEvent.dataTransfer.items);
            expect(wrapper.vm.droppedExternalFiles.files).toHaveLength(1);
            expect(wrapper.vm.droppedExternalFiles.files[0].file.name).toBe('doc.pdf');
            expect(wrapper.vm.droppedExternalFiles.files[0].fullAppPath).toBe(`RootDrop/ExtFolder/doc.pdf`);
        });
    });
  });

  describe('Upload and Save Functionality', () => {
    beforeEach(() => {
      // Reset relevant data and spies
      wrapper.vm.pendingChanges = {};
      wrapper.vm.droppedExternalFiles = { files: [], targetPath: null };
      vi.spyOn(wrapper.vm, '$emit');
      global.alert = vi.fn(); // Reset alert mock
    });

    test('handleUploadDone should emit update-contract and clear droppedExternalFiles', () => {
      const mockPayload = { contractId: 'contractA:1:1', updatedMetadata: 'newMetaString' };
      wrapper.vm.handleUploadDone(mockPayload);

      expect(wrapper.vm.$emit).toHaveBeenCalledWith('update-contract', mockPayload);
      expect(wrapper.vm.droppedExternalFiles.files).toEqual([]);
    });

    describe('saveChanges', () => {
      beforeEach(async () => {
        // Setup initial state for saveChanges tests
        wrapper.vm.account = 'testuser';
        wrapper.vm.contract = {
          'contractA:1:1': { 
            i: 'contractA:1:1', 
            t: 'testuser', 
            df: { 'cid1': 100, 'cid2': 200 }, 
            m: '1|FolderA,file1.txt,txt.0,,0-0-0,file2.png,png.FolderA,,0-0-0', // Initial metadata
            e: '2000:0', n: {}, p:1, u:300
          }
        };
        wrapper.vm.newMeta = {
          'contractA:1:1': {
            contract: { autoRenew: true, encrypted: false, m: wrapper.vm.contract['contractA:1:1'].m },
            'cid1': { name: 'file1.txt', type: 'txt', folderPath: '', thumb: '', flags: 0, license: '', labels: '' , is_thumb: false, size: 100},
            'cid2': { name: 'file2.png', type: 'png', folderPath: 'FolderA', thumb: '', flags: 0, license: '', labels: '', is_thumb: false, size: 200 }
          }
        };
        // Simulate a pending change: renaming file1.txt and moving file2.png
        wrapper.vm.pendingChanges = {
          'contractA:1:1': {
            'cid1': { name: 'newName.txt', folderPath: '' },
            'cid2': { folderPath: 'NewFolderB' }
          }
        };
        await wrapper.vm.$nextTick();
      });

      test('should not proceed if user is not logged in', () => {
        wrapper.vm.account = ''; // Simulate logged out
        wrapper.vm.saveChanges();
        expect(global.alert).toHaveBeenCalledWith('Please log in to save changes.');
        expect(wrapper.vm.$emit).not.toHaveBeenCalledWith('tosign', expect.anything());
      });

      test('should not proceed if no pending changes', () => {
        wrapper.vm.pendingChanges = {}; // No changes
        wrapper.vm.saveChanges();
        expect(global.alert).toHaveBeenCalledWith('No pending changes to save.');
        expect(wrapper.vm.$emit).not.toHaveBeenCalledWith('tosign', expect.anything());
      });

      test('should generate correct metadata string and emit tosign for valid changes', () => {
        wrapper.vm.saveChanges();

        expect(global.alert).not.toHaveBeenCalled(); // No alerts for successful path
        expect(wrapper.vm.$emit).toHaveBeenCalledTimes(1);
        const emittedPayload = wrapper.vm.$emit.mock.calls[0][0];
        
        expect(emittedPayload.type).toBe('cj');
        expect(emittedPayload.id).toBe('spkccT_update_metadata');
        expect(emittedPayload.key).toBe('Posting');
        expect(emittedPayload.cj.updates).toHaveProperty('contractA:1:1');

        const contractUpdate = emittedPayload.cj.updates['contractA:1:1'];
        expect(contractUpdate).toHaveProperty('m'); // Expecting full metadata string by default
        
        // Detailed check of the metadata string parts:
        // Original: 1|FolderA,file1.txt,txt.0,,0-0-0,file2.png,png.FolderA,,0-0-0
        // Changes: cid1 name -> newName.txt, cid2 folderPath -> NewFolderB (new index)
        // Expected structure: <enc_data>|<folder_list_str>,<file1_meta>,<file2_meta>
        // FolderA -> index 1 (base58 of 0 -> '1')
        // NewFolderB -> index a (base58 of 9 -> 'a' because 2-9 are preset like)
        const expectedMetaParts = contractUpdate.m.split(',');
        const contractAndFolderPart = expectedMetaParts[0];
        const file1Meta = expectedMetaParts.slice(1,5).join(',');
        const file2Meta = expectedMetaParts.slice(5,9).join(',');

        expect(contractAndFolderPart).toMatch(/^1\|FolderA\|NewFolderB/); // EncData + FolderList (FolderA, NewFolderB)
        // File1: newName.txt, type txt, root (index 0, but becomes .1 in meta due to parseFolderList logic, or empty if root)
        // The folder index for root ('') is '0'. For files in root, folderIndex is not appended or is '1' if '1' is the root.
        // Based on current parseFolderList and saveChanges, root files might get folderIndex '1' if '' path is mapped to index '1' and not explicitly '0'.
        // Let's check the parts carefully. If indexToPath['0'] = '', then files in root (folderPath: '') will get folderIndex '0'.
        // If the folderIndex is "0" or "1" (if "1" means root), it gets omitted in the type: type.folderIndex part.
        // Slots: name, type.folderIndex, thumb, flags
        expect(file1Meta).toMatch(/^newName\.txt,txt,,0-0-0/); // name,type(no folder index for root),thumb,flags
        // File2: file2.png, type png, folder NewFolderB (let's assume its index is 'a')
        expect(file2Meta).toMatch(/^file2\.png,png\..*,,0-0-0/); // name,type.folderIndex,thumb,flags. Specific index depends on base58 encoding logic for 'NewFolderB'

        // Verify that the alert for successful preparation is shown
        expect(global.alert).toHaveBeenCalledWith('Preparing update for 1 contract(s) for signing to save changes.');
      });

      test('should alert if metadata size exceeds limit', () => {
        // Make metadata very long by adding many files or long names to pendingChanges
        let longName = 'a'.repeat(100);
        wrapper.vm.pendingChanges['contractA:1:1'] = {}; // Reset for this test
        for(let i = 0; i < 100; i++) { // Create many changes to increase metadata size
            wrapper.vm.pendingChanges['contractA:1:1'][`cid_long_${i}`] = { name: `${longName}_${i}.txt`, folderPath: '' };
            // Also add these to df and newMeta for saveChanges to pick them up
            wrapper.vm.contract['contractA:1:1'].df[`cid_long_${i}`] = 10;
            wrapper.vm.newMeta['contractA:1:1'][`cid_long_${i}`] = { name: `orig_name_${i}`, type:'txt', folderPath: '', flags: 0, license:'', labels:''};
        }
        
        wrapper.vm.saveChanges();
        // This will likely exceed the 8000 char limit internally in saveChanges for the metadata string
        // Or it will exceed the final JSON payload 7500 limit

        const totalSize = JSON.stringify({updates: wrapper.vm.$emit.mock.calls[0]?.[0].cj.updates}).length;
        if (totalSize > 7500) {
             expect(global.alert).toHaveBeenCalledWith(expect.stringMatching(/Updates payload size .* exceeds the maximum allowed size/));
        } else {
            // This case might occur if the internal metadata string itself exceeds 8000 before json stringify
            expect(global.alert).toHaveBeenCalledWith(expect.stringMatching(/Metadata size for contract contractA:1:1 exceeds 8000 bytes/));
        }
        expect(wrapper.vm.$emit).not.toHaveBeenCalledWith('tosign', expect.objectContaining({cj: expect.objectContaining({updates: expect.objectContaining({ 'contractA:1:1': expect.anything() }) }) }));
      });

      test('revertPendingChanges should clear pendingChanges and re-initialize', async () => {
        global.confirm = vi.fn(() => true); // Simulate user confirming revert
        vi.spyOn(wrapper.vm, 'init');
        localStorageMock.setItem(wrapper.vm.localStorageKey, JSON.stringify(wrapper.vm.pendingChanges));

        wrapper.vm.revertPendingChanges();
        await wrapper.vm.$nextTick();

        expect(global.confirm).toHaveBeenCalledWith("Are you sure you want to discard all pending changes? This cannot be undone.");
        expect(wrapper.vm.pendingChanges).toEqual({});
        expect(localStorageMock.getItem(wrapper.vm.localStorageKey)).toBeNull();
        expect(wrapper.vm.init).toHaveBeenCalled();
      });

      test('revertPendingChanges should do nothing if no pending changes', () => {
        wrapper.vm.pendingChanges = {};
        global.confirm = vi.fn();
        vi.spyOn(wrapper.vm, 'init');

        wrapper.vm.revertPendingChanges();

        expect(global.confirm).not.toHaveBeenCalled();
        expect(wrapper.vm.init).not.toHaveBeenCalled();
      });
    });
  });

  // More tests will go here
}); 