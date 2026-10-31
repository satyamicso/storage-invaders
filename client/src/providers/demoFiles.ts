import type { FileMeta } from '@storage-invaders/shared';

export const DEMO_FILES: FileMeta[] = [
  // 1-12: Obvious Large Installers (Junk)
  {
    id: 'demo-inst-1',
    name: 'ubuntu-22.04.3-desktop-amd64.iso',
    mimeType: 'application/x-iso9660-image',
    size: 4724464025, // 4.72 GB
    modifiedTime: '2023-08-11T14:32:00Z',
    viewedByMeTime: '2023-08-11T14:40:00Z',
  },
  {
    id: 'demo-inst-2',
    name: 'DockerDesktop-4.25.0-x86_64.dmg',
    mimeType: 'application/x-apple-diskimage',
    size: 896532480, // 896 MB
    modifiedTime: '2023-10-19T09:15:00Z',
    viewedByMeTime: '2023-10-19T09:25:00Z',
  },
  {
    id: 'demo-inst-3',
    name: 'UnrealEngine-5.3.1-Setup.exe',
    mimeType: 'application/x-msdownload',
    size: 7842100000, // 7.84 GB
    modifiedTime: '2023-09-02T18:20:00Z',
    viewedByMeTime: '2023-09-02T19:00:00Z',
  },
  {
    id: 'demo-inst-4',
    name: 'Blender-4.0.0-windows-x64.msi',
    mimeType: 'application/x-msi',
    size: 345100000, // 345 MB
    modifiedTime: '2023-11-14T11:00:00Z',
    viewedByMeTime: '2023-11-14T11:15:00Z',
  },
  {
    id: 'demo-inst-5',
    name: 'VirtualBox-7.0.12-159484-Win.exe',
    mimeType: 'application/x-msdownload',
    size: 114294784, // 114 MB
    modifiedTime: '2023-10-18T16:45:00Z',
    viewedByMeTime: '2023-10-18T16:50:00Z',
  },
  {
    id: 'demo-inst-6',
    name: 'Postman-win64-Setup-v10.20.0.exe',
    mimeType: 'application/x-msdownload',
    size: 168420000, // 168 MB
    modifiedTime: '2023-11-01T08:12:00Z',
    viewedByMeTime: '2023-11-01T08:20:00Z',
  },
  {
    id: 'demo-inst-7',
    name: 'SlackSetup-x64-4.34.121.exe',
    mimeType: 'application/x-msdownload',
    size: 94371840, // 94 MB
    modifiedTime: '2023-09-12T13:30:00Z',
    viewedByMeTime: '2023-09-12T13:35:00Z',
  },
  {
    id: 'demo-inst-8',
    name: 'node-v20.9.0-x64.msi',
    mimeType: 'application/x-msi',
    size: 32505856, // 32.5 MB
    modifiedTime: '2023-10-24T10:11:00Z',
    viewedByMeTime: '2023-10-24T10:15:00Z',
  },
  {
    id: 'demo-inst-9',
    name: 'VSCodeUserSetup-x64-1.84.2.exe',
    mimeType: 'application/x-msdownload',
    size: 92160000, // 92 MB
    modifiedTime: '2023-11-09T15:20:00Z',
    viewedByMeTime: '2023-11-09T15:30:00Z',
  },
  {
    id: 'demo-inst-10',
    name: 'GoogleChromeStandaloneEnterprise64.msi',
    mimeType: 'application/x-msi',
    size: 104857600, // 100 MB
    modifiedTime: '2023-06-20T12:00:00Z',
    viewedByMeTime: '2023-06-20T12:05:00Z',
  },
  {
    id: 'demo-inst-11',
    name: 'UnityHubSetup-v3.6.0.exe',
    mimeType: 'application/x-msdownload',
    size: 157286400, // 150 MB
    modifiedTime: '2023-07-15T14:10:00Z',
    viewedByMeTime: '2023-07-15T14:20:00Z',
  },
  {
    id: 'demo-inst-12',
    name: 'ZoomInstallerFull_v5.16.2.pkg',
    mimeType: 'application/x-newton-compatible-pkg',
    size: 78643200, // 78 MB
    modifiedTime: '2023-10-04T17:00:00Z',
    viewedByMeTime: '2023-10-04T17:10:00Z',
  },

  // 13-24: Redundant Duplicate Copies (Junk)
  {
    id: 'demo-dup-1',
    name: 'Q3_Financial_Review_v4 (1).xlsx',
    mimeType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    size: 48234496, // 48 MB
    modifiedTime: '2023-10-15T16:20:00Z',
    viewedByMeTime: '2023-10-15T16:22:00Z',
  },
  {
    id: 'demo-dup-2',
    name: 'Pitch_Deck_Series_A_Final (1).pdf',
    mimeType: 'application/pdf',
    size: 84934656, // 84 MB
    modifiedTime: '2023-09-08T20:10:00Z',
    viewedByMeTime: '2023-09-08T20:11:00Z',
  },
  {
    id: 'demo-dup-3',
    name: 'Customer_Analytics_Dump_2023 (1).csv',
    mimeType: 'text/csv',
    size: 1258291200, // 1.25 GB
    modifiedTime: '2023-08-30T11:45:00Z',
    viewedByMeTime: '2023-08-30T11:46:00Z',
  },
  {
    id: 'demo-dup-4',
    name: 'Vacation_Photos_Archive - Copy.zip',
    mimeType: 'application/zip',
    size: 2411724800, // 2.41 GB
    modifiedTime: '2022-07-22T19:30:00Z',
    viewedByMeTime: '2022-07-22T19:35:00Z',
  },
  {
    id: 'demo-dup-5',
    name: 'Brand_Identity_Asset_Pack (1).ai',
    mimeType: 'application/postscript',
    size: 342884352, // 342 MB
    modifiedTime: '2023-05-18T14:15:00Z',
    viewedByMeTime: '2023-05-18T14:16:00Z',
  },
  {
    id: 'demo-dup-6',
    name: 'Product_Roadmap_2024_Master (2).pptx',
    mimeType: 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
    size: 67108864, // 67 MB
    modifiedTime: '2023-11-02T13:20:00Z',
    viewedByMeTime: '2023-11-02T13:21:00Z',
  },
  {
    id: 'demo-dup-7',
    name: 'Vendor_Master_Contract_Template (1).docx',
    mimeType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    size: 15728640, // 15 MB
    modifiedTime: '2023-04-10T09:40:00Z',
    viewedByMeTime: '2023-04-10T09:41:00Z',
  },
  {
    id: 'demo-dup-8',
    name: 'Database_Migration_Script_v2 (1).sql',
    mimeType: 'application/sql',
    size: 188743680, // 188 MB
    modifiedTime: '2023-06-14T22:15:00Z',
    viewedByMeTime: '2023-06-14T22:16:00Z',
  },
  {
    id: 'demo-dup-9',
    name: 'Annual_Tax_Summary_Spreadsheet (1).xlsx',
    mimeType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    size: 26214400, // 26 MB
    modifiedTime: '2023-03-29T15:30:00Z',
    viewedByMeTime: '2023-03-29T15:31:00Z',
  },
  {
    id: 'demo-dup-10',
    name: 'Team_Offsite_Video_Reel (1).mp4',
    mimeType: 'video/mp4',
    size: 891289600, // 891 MB
    modifiedTime: '2022-10-05T18:00:00Z',
    viewedByMeTime: '2022-10-05T18:05:00Z',
  },
  {
    id: 'demo-dup-11',
    name: 'Architecture_Diagram_Export (1).png',
    mimeType: 'image/png',
    size: 36700160, // 36 MB
    modifiedTime: '2023-07-09T11:10:00Z',
    viewedByMeTime: '2023-07-09T11:11:00Z',
  },
  {
    id: 'demo-dup-12',
    name: 'Machine_Learning_Weights_Checkpoint (1).bin',
    mimeType: 'application/octet-stream',
    size: 3221225472, // 3.22 GB
    modifiedTime: '2023-08-01T04:20:00Z',
    viewedByMeTime: '2023-08-01T04:21:00Z',
  },

  // 25-36: Forgotten Old Screen Recordings & Cache Dumps (Junk)
  {
    id: 'demo-rec-1',
    name: 'Screen Recording 2022-04-12 at 14.22.11.mov',
    mimeType: 'video/quicktime',
    size: 786432000, // 786 MB
    modifiedTime: '2022-04-12T14:25:00Z',
    viewedByMeTime: '2022-04-12T14:30:00Z',
  },
  {
    id: 'demo-rec-2',
    name: 'Screen Recording 2022-09-30 at 10.05.42.mov',
    mimeType: 'video/quicktime',
    size: 1468006400, // 1.46 GB
    modifiedTime: '2022-09-30T10:15:00Z',
    viewedByMeTime: '2022-09-30T10:20:00Z',
  },
  {
    id: 'demo-rec-3',
    name: 'Zoom_Meeting_Recording_2021-11-09.mp4',
    mimeType: 'video/mp4',
    size: 1932735283, // 1.93 GB
    modifiedTime: '2021-11-09T17:30:00Z',
    viewedByMeTime: '2021-11-09T17:45:00Z',
  },
  {
    id: 'demo-rec-4',
    name: 'OBS_Gameplay_Capture_Stream_2021.mkv',
    mimeType: 'video/x-matroska',
    size: 4187593113, // 4.18 GB
    modifiedTime: '2021-08-14T23:45:00Z',
    viewedByMeTime: '2021-08-15T00:10:00Z',
  },
  {
    id: 'demo-rec-5',
    name: 'node_modules_backup_2022.tar.gz',
    mimeType: 'application/gzip',
    size: 943718400, // 943 MB
    modifiedTime: '2022-02-18T16:00:00Z',
    viewedByMeTime: '2022-02-18T16:05:00Z',
  },
  {
    id: 'demo-rec-6',
    name: 'electron_build_cache_dump.zip',
    mimeType: 'application/zip',
    size: 524288000, // 524 MB
    modifiedTime: '2023-01-20T12:00:00Z',
    viewedByMeTime: '2023-01-20T12:05:00Z',
  },
  {
    id: 'demo-rec-7',
    name: 'system_crash_dump_20230514.dmp',
    mimeType: 'application/octet-stream',
    size: 1181116006, // 1.18 GB
    modifiedTime: '2023-05-14T03:15:00Z',
    viewedByMeTime: '2023-05-14T03:20:00Z',
  },
  {
    id: 'demo-rec-8',
    name: 'Screen Recording 2023-01-15 at 19.40.11.mov',
    mimeType: 'video/quicktime',
    size: 419430400, // 419 MB
    modifiedTime: '2023-01-15T19:45:00Z',
    viewedByMeTime: '2023-01-15T19:50:00Z',
  },
  {
    id: 'demo-rec-9',
    name: 'Loom_Video_Bug_Report_Walkthrough_2022.mp4',
    mimeType: 'video/mp4',
    size: 335544320, // 335 MB
    modifiedTime: '2022-11-20T14:10:00Z',
    viewedByMeTime: '2022-11-20T14:20:00Z',
  },
  {
    id: 'demo-rec-10',
    name: 'docker_container_logs_debug.log',
    mimeType: 'text/plain',
    size: 157286400, // 157 MB
    modifiedTime: '2023-02-10T18:00:00Z',
    viewedByMeTime: '2023-02-10T18:05:00Z',
  },
  {
    id: 'demo-rec-11',
    name: 'Screen Recording 2023-03-22 at 09.11.02.mov',
    mimeType: 'video/quicktime',
    size: 629145600, // 629 MB
    modifiedTime: '2023-03-22T09:18:00Z',
    viewedByMeTime: '2023-03-22T09:25:00Z',
  },
  {
    id: 'demo-rec-12',
    name: 'temp_blender_render_cache.bin',
    mimeType: 'application/octet-stream',
    size: 734003200, // 734 MB
    modifiedTime: '2023-04-05T21:30:00Z',
    viewedByMeTime: '2023-04-05T21:35:00Z',
  },

  // 37-48: Critical Documents (KEEP - Guarded)
  {
    id: 'demo-keep-1',
    name: 'Tax_Return_2025_Final_Signed.pdf',
    mimeType: 'application/pdf',
    size: 14680064, // 14.6 MB
    modifiedTime: '2025-04-12T10:15:00Z',
    viewedByMeTime: '2025-04-14T09:00:00Z',
  },
  {
    id: 'demo-keep-2',
    name: 'Official_Passport_Scan_JP.pdf',
    mimeType: 'application/pdf',
    size: 6291456, // 6.2 MB
    modifiedTime: '2024-06-20T14:30:00Z',
    viewedByMeTime: '2024-08-10T11:20:00Z',
  },
  {
    id: 'demo-keep-3',
    name: 'Executive_Employment_Agreement_Executed.pdf',
    mimeType: 'application/pdf',
    size: 9437184, // 9.4 MB
    modifiedTime: '2024-01-15T16:00:00Z',
    viewedByMeTime: '2024-03-01T10:00:00Z',
  },
  {
    id: 'demo-keep-4',
    name: 'Apartment_Lease_Agreement_2025_2026.pdf',
    mimeType: 'application/pdf',
    size: 18874368, // 18.8 MB
    modifiedTime: '2025-01-08T18:45:00Z',
    viewedByMeTime: '2025-01-10T12:30:00Z',
  },
  {
    id: 'demo-keep-5',
    name: 'W2_Wage_and_Tax_Statement_2024.pdf',
    mimeType: 'application/pdf',
    size: 3145728, // 3.1 MB
    modifiedTime: '2025-01-28T09:15:00Z',
    viewedByMeTime: '2025-02-02T14:20:00Z',
  },
  {
    id: 'demo-keep-6',
    name: 'Master_Resume_Software_Engineering_2026.pdf',
    mimeType: 'application/pdf',
    size: 2097152, // 2 MB
    modifiedTime: '2026-02-14T11:00:00Z',
    viewedByMeTime: '2026-02-20T15:30:00Z',
  },
  {
    id: 'demo-keep-7',
    name: 'Last_Will_and_Testament_Notarized.pdf',
    mimeType: 'application/pdf',
    size: 8388608, // 8.3 MB
    modifiedTime: '2024-09-12T13:40:00Z',
    viewedByMeTime: '2024-09-15T10:00:00Z',
  },
  {
    id: 'demo-keep-8',
    name: 'Term_Life_Insurance_Policy_Terms.pdf',
    mimeType: 'application/pdf',
    size: 12582912, // 12.5 MB
    modifiedTime: '2024-05-18T10:20:00Z',
    viewedByMeTime: '2024-05-20T08:45:00Z',
  },
  {
    id: 'demo-keep-9',
    name: 'University_Degree_Diploma_Transcript.pdf',
    mimeType: 'application/pdf',
    size: 7340032, // 7.3 MB
    modifiedTime: '2023-12-05T15:10:00Z',
    viewedByMeTime: '2024-01-10T16:00:00Z',
  },
  {
    id: 'demo-keep-10',
    name: 'Mutual_NDA_Google_Partnership_Signed.pdf',
    mimeType: 'application/pdf',
    size: 5242880, // 5.2 MB
    modifiedTime: '2025-06-11T17:30:00Z',
    viewedByMeTime: '2025-06-12T09:15:00Z',
  },
  {
    id: 'demo-keep-11',
    name: 'Vehicle_Title_and_Registration_Doc.pdf',
    mimeType: 'application/pdf',
    size: 4194304, // 4.1 MB
    modifiedTime: '2024-07-22T14:15:00Z',
    viewedByMeTime: '2024-07-25T11:00:00Z',
  },
  {
    id: 'demo-keep-12',
    name: 'Certified_Birth_Certificate_Scan.pdf',
    mimeType: 'application/pdf',
    size: 6291456, // 6.2 MB
    modifiedTime: '2023-04-18T12:00:00Z',
    viewedByMeTime: '2023-04-20T10:30:00Z',
  },

  // 49-60: Ambiguous / Unsure Files (MAYBE - Player Decision)
  {
    id: 'demo-maybe-1',
    name: 'Series_B_Investor_Pitch_Draft_2023.pptx',
    mimeType: 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
    size: 115343360, // 115 MB
    modifiedTime: '2023-09-14T19:30:00Z',
    viewedByMeTime: '2023-09-20T11:00:00Z',
  },
  {
    id: 'demo-maybe-2',
    name: 'Iceland_Landscape_Raw_Captures.RAW',
    mimeType: 'image/x-raw',
    size: 2516582400, // 2.51 GB
    modifiedTime: '2022-08-25T16:40:00Z',
    viewedByMeTime: '2022-09-01T10:15:00Z',
  },
  {
    id: 'demo-maybe-3',
    name: 'Tech_Podcast_Episode_34_Audio_Stems.wav',
    mimeType: 'audio/wav',
    size: 1572864000, // 1.57 GB
    modifiedTime: '2023-03-12T14:20:00Z',
    viewedByMeTime: '2023-03-15T09:30:00Z',
  },
  {
    id: 'demo-maybe-4',
    name: 'CAD_Architectural_Floorplan_Model_v3.dwg',
    mimeType: 'image/vnd.dwg',
    size: 367001600, // 367 MB
    modifiedTime: '2023-06-28T18:10:00Z',
    viewedByMeTime: '2023-07-02T13:45:00Z',
  },
  {
    id: 'demo-maybe-5',
    name: 'Company_All_Hands_Keynote_2023.key',
    mimeType: 'application/x-iwork-keynote-sffkey',
    size: 157286400, // 157 MB
    modifiedTime: '2023-11-15T15:00:00Z',
    viewedByMeTime: '2023-11-16T10:00:00Z',
  },
  {
    id: 'demo-maybe-6',
    name: 'Global_Supply_Chain_Model_2025.xlsx',
    mimeType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    size: 54525952, // 54 MB
    modifiedTime: '2023-10-08T12:30:00Z',
    viewedByMeTime: '2023-10-10T14:20:00Z',
  },
  {
    id: 'demo-maybe-7',
    name: 'Design_System_Master_Component_Library.fig',
    mimeType: 'application/octet-stream',
    size: 199229440, // 199 MB
    modifiedTime: '2023-10-30T17:15:00Z',
    viewedByMeTime: '2023-11-04T09:40:00Z',
  },
  {
    id: 'demo-maybe-8',
    name: 'Unsorted_Family_Archive_2019_2022.zip',
    mimeType: 'application/zip',
    size: 3984588800, // 3.98 GB
    modifiedTime: '2022-12-31T23:59:00Z',
    viewedByMeTime: '2023-01-05T16:00:00Z',
  },
  {
    id: 'demo-maybe-9',
    name: 'PostgreSQL_Analytics_Warehouse_Export.dump',
    mimeType: 'application/octet-stream',
    size: 1887436800, // 1.88 GB
    modifiedTime: '2023-05-20T03:00:00Z',
    viewedByMeTime: '2023-05-20T03:30:00Z',
  },
  {
    id: 'demo-maybe-10',
    name: 'Client_Product_Demo_HighRes_Master.mov',
    mimeType: 'video/quicktime',
    size: 2202009600, // 2.20 GB
    modifiedTime: '2023-07-19T20:15:00Z',
    viewedByMeTime: '2023-07-20T10:00:00Z',
  },
  {
    id: 'demo-maybe-11',
    name: 'Machine_Learning_Training_Dataset.parquet',
    mimeType: 'application/octet-stream',
    size: 1677721600, // 1.67 GB
    modifiedTime: '2023-08-14T11:20:00Z',
    viewedByMeTime: '2023-08-15T09:00:00Z',
  },
  {
    id: 'demo-maybe-12',
    name: 'Conference_Keynote_Audio_Master.flac',
    mimeType: 'audio/flac',
    size: 838860800, // 838 MB
    modifiedTime: '2023-09-25T14:00:00Z',
    viewedByMeTime: '2023-09-26T16:30:00Z',
  },
];
