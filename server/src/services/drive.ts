import { drive_v3, auth } from '@googleapis/drive';
import pLimit from 'p-limit';
import type { FileMeta, ActionResult } from '@storage-invaders/shared';

export class DriveService {
  private createDriveClient(accessToken: string): drive_v3.Drive {
    const oauth2Client = new auth.OAuth2();
    oauth2Client.setCredentials({ access_token: accessToken });
    return new drive_v3.Drive({ auth: oauth2Client });
  }

  /**
   * Retrieves largest, non-folder, non-Google-native files sorted by quota used descending.
   * Minimal fields projection for extreme efficiency.
   */
  public async listCandidates(
    accessToken: string,
    limit = 60
  ): Promise<FileMeta[]> {
    const drive = this.createDriveClient(accessToken);

    // Query: non-trashed, owned by current user, not a directory folder
    const q = [
      "trashed = false",
      "'me' in owners",
      "mimeType != 'application/vnd.google-apps.folder'",
      // Exclude Google-native Docs, Sheets, Slides, Forms (0 bytes against quota)
      "mimeType != 'application/vnd.google-apps.document'",
      "mimeType != 'application/vnd.google-apps.spreadsheet'",
      "mimeType != 'application/vnd.google-apps.presentation'",
      "mimeType != 'application/vnd.google-apps.form'",
    ].join(' and ');

    const res = await drive.files.list({
      q,
      orderBy: 'quotaBytesUsed desc',
      pageSize: Math.min(100, Math.max(10, limit)),
      fields: 'files(id, name, mimeType, size, modifiedTime, viewedByMeTime, parents)',
      spaces: 'drive',
    });

    const items = res.data.files || [];

    const candidates: FileMeta[] = items
      .filter((item): item is typeof item & { id: string; name: string } => {
        return Boolean(item.id && item.name && item.size);
      })
      .map((item) => ({
        id: item.id!,
        name: item.name!,
        mimeType: item.mimeType || 'application/octet-stream',
        size: item.size ? parseInt(item.size, 10) : 0,
        modifiedTime: item.modifiedTime || new Date().toISOString(),
        viewedByMeTime: item.viewedByMeTime || undefined,
        parents: item.parents || undefined,
        trashed: false,
      }));

    return candidates;
  }

  /**
   * Moves real files to Google Drive trash in the background.
   * Concurrency-limited with p-limit to prevent HTTP 429 rate limits.
   * ABSOLUTE SECURITY GUARANTEE: Never invokes files.delete or emptyTrash.
   */
  public async trashFiles(
    accessToken: string,
    fileIds: string[]
  ): Promise<ActionResult[]> {
    const drive = this.createDriveClient(accessToken);
    const limit = pLimit(5); // Concurrency cap

    const tasks = fileIds.map((id) =>
      limit(async (): Promise<ActionResult> => {
        try {
          await drive.files.update({
            fileId: id,
            requestBody: {
              trashed: true,
            },
            fields: 'id, trashed',
          });

          return {
            id,
            success: true,
            trashed: true,
          };
        } catch (err) {
          const errMsg = err instanceof Error ? err.message : 'Unknown Drive API error';
          return {
            id,
            success: false,
            trashed: false,
            error: errMsg,
          };
        }
      })
    );

    return Promise.all(tasks);
  }

  /**
   * Restores previously trashed files back into active Drive.
   * Uses files.update with trashed: false.
   */
  public async restoreFiles(
    accessToken: string,
    fileIds: string[]
  ): Promise<ActionResult[]> {
    const drive = this.createDriveClient(accessToken);
    const limit = pLimit(5);

    const tasks = fileIds.map((id) =>
      limit(async (): Promise<ActionResult> => {
        try {
          await drive.files.update({
            fileId: id,
            requestBody: {
              trashed: false,
            },
            fields: 'id, trashed',
          });

          return {
            id,
            success: true,
            trashed: false,
          };
        } catch (err) {
          const errMsg = err instanceof Error ? err.message : 'Unknown Drive API error';
          return {
            id,
            success: false,
            trashed: true,
            error: errMsg,
          };
        }
      })
    );

    return Promise.all(tasks);
  }
}

export const driveService = new DriveService();
