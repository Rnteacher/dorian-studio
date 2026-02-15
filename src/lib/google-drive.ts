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
  const drive = getDriveClient()
  if (!drive) return null

  const parentFolderId = process.env.GOOGLE_DRIVE_PARENT_FOLDER_ID
  if (!parentFolderId) return null

  try {
    const folderName = clientName
      ? `${clientName} — ${projectName}`
      : projectName

    const res = await drive.files.create({
      requestBody: {
        name: folderName,
        mimeType: 'application/vnd.google-apps.folder',
        parents: [parentFolderId],
      },
      fields: 'id, webViewLink',
    })

    return res.data.webViewLink ?? null
  } catch (err) {
    console.error('Google Drive folder creation failed:', err)
    return null
  }
}
