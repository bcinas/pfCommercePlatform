import { exec } from 'child_process'
import { promisify } from 'util'
import path from 'path'

const execAsync = promisify(exec)

async function globalSetup(): Promise<void> {
  console.log('[E2E] Running database seed before test suite...')
  const backendDir = path.resolve(__dirname, '../backend')

  try {
    const { stdout, stderr } = await execAsync('npm run seed', { cwd: backendDir })
    if (stdout) console.log('[E2E seed]', stdout)
    if (stderr) console.error('[E2E seed stderr]', stderr)
    console.log('[E2E] Seed completed successfully.')
  } catch (err) {
    console.error('[E2E] Seed failed:', err)
    throw err
  }
}

export default globalSetup
