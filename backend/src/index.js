import express from 'express'
import cors from 'cors'
import dotenv from 'dotenv'
import authRoutes from './routes/auth.js'
import taskRoutes from './routes/tasks.js'
import leadRoutes from './routes/leads.js'
import projectRoutes from './routes/projects.js'
import dashboardRoutes from './routes/dashboard.js'
import subtaskRoutes from './routes/subtasks.js'
import commentRoutes from './routes/comments.js'
import attachmentRoutes from './routes/attachments.js'
import projectFlowRoutes from './routes/projectFlows.js'
import taskFlowRoutes from './routes/taskFlows.js'
import noteRoutes from './routes/notes.js'
import noteFolderRoutes from './routes/noteFolders.js'
import flowchartRoutes from './routes/flowcharts.js'
import searchRoutes from './routes/search.js'
import uploadRoutes from './routes/uploads.js'
import backlinkRoutes from './routes/backlinks.js'
import aiRoutes from './routes/ai.js'
import habitRoutes from './routes/habits.js'
import workspaceRoutes from './routes/workspace.js'
import realtimeRoutes from './routes/realtime.js'
import { startReminderLoop } from './services/reminders.js'
import { startRecurrenceLoop } from './services/recurrence.js'
import { runMigrations } from './database/migrations.js'
import { realtimeMutationObserver } from './services/realtime.js'

dotenv.config()

const app = express()
app.use(cors())
app.use(express.json({ limit: '2mb' }))
app.use(realtimeMutationObserver)

app.use('/api/auth', authRoutes)
app.use('/api', realtimeRoutes)
app.use('/api/tasks', taskRoutes)
app.use('/api/leads', leadRoutes)
app.use('/api/projects', projectRoutes)
app.use('/api/dashboard', dashboardRoutes)
app.use('/api', subtaskRoutes)
app.use('/api', commentRoutes)
app.use('/api', attachmentRoutes)
app.use('/api', projectFlowRoutes)
app.use('/api', taskFlowRoutes)
app.use('/api', noteRoutes)
app.use('/api', noteFolderRoutes)
app.use('/api', flowchartRoutes)
app.use('/api', searchRoutes)
app.use('/api', uploadRoutes)
app.use('/api', backlinkRoutes)
app.use('/api', aiRoutes)
app.use('/api', habitRoutes)
app.use('/api', workspaceRoutes)

const PORT = process.env.PORT || 3000
async function start() {
  await runMigrations()
  app.listen(PORT, () => {
    console.log(`API rodando na porta ${PORT}`)
    startReminderLoop()
    startRecurrenceLoop()
  })
}

start().catch((error) => {
  console.error('Falha ao iniciar API:', error)
  process.exit(1)
})
