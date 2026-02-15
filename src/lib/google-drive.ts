import { google } from 'googleapis'

function getDriveClient() {
  const email = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL
  const key = process.env.GOOGLE_SERVICE_ACCOUNT_KEY

  if (!email || !key) return null

  const auth = new google.auth.JWT({
    email,
    key: key.replace(/\\n/g, '\n'),
    scopes: ['https://www.googleapis.com/auth/drive.file'],
  })

  return google.drive({ version: 'v3', auth })
}

export async function createProjectFolder(
  projectName: string,
  clientName: string
): Promise<string | null> {
  console.log('[GoogleDrive] createProjectFolder called:', { projectName, clientName })

  const drive = getDriveClient()
  if (!drive) {
    console.log('[GoogleDrive] SKIPPED — Service Account not configured')
    console.log('[GoogleDrive] EMAIL:', process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL ? 'SET' : 'MISSING')
    console.log('[GoogleDrive] KEY:', process.env.GOOGLE_SERVICE_ACCOUNT_KEY ? `SET (${process.env.GOOGLE_SERVICE_ACCOUNT_KEY.length} chars)` : 'MISSING')
    return null
  }

  const parentFolderId = process.env.GOOGLE_DRIVE_PARENT_FOLDER_ID
  if (!parentFolderId) {
    console.log('[GoogleDrive] SKIPPED — GOOGLE_DRIVE_PARENT_FOLDER_ID not set')
    return null
  }

  try {
    const folderName = clientName
      ? `${clientName} — ${projectName}`
      : projectName

    console.log('[GoogleDrive] Creating folder:', folderName, 'in parent:', parentFolderId)

    const res = await drive.files.create({
      requestBody: {
        name: folderName,
        mimeType: 'application/vnd.google-apps.folder',
        parents: [parentFolderId],
      },
      fields: 'id, webViewLink',
    })

    const fileId = res.data.id
    if (fileId) {
      // Make the folder accessible to anyone with the link (editor)
      await drive.permissions.create({
        fileId,
        requestBody: {
          role: 'writer',
          type: 'anyone',
        },
      })
      console.log('[GoogleDrive] Permissions set: anyone with link can edit')
    }

    console.log('[GoogleDrive] SUCCESS — webViewLink:', res.data.webViewLink)
    return res.data.webViewLink ?? null
  } catch (err) {
    console.error('[GoogleDrive] FAILED:', err instanceof Error ? err.message : err)
    return null
  }
}
