import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import winston from 'winston'
import DailyRotateFile from 'winston-daily-rotate-file'
import util from 'util'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const logDir = path.join(__dirname, 'logs')
if (!fs.existsSync(logDir)) {
    fs.mkdirSync(logDir)
}

const logger = winston.createLogger({
    level: 'info',
    format:
        winston.format.combine(
            winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
            winston.format.printf(
                (info) => `[${info.timestamp}] ${info.level.toUpperCase()} — ${info.message}`
            )
        ),
    transports: [
        new DailyRotateFile({
            filename: path.join(logDir, '%DATE%.log'),
            datePattern: 'YYYY-MM-DD',
            zippedArchive: true,
            maxSize: '5m',
            maxFiles: '30d'
        }),

        new winston.transports.Console()
    ]
})

const formatArgs = (args) =>
    args
        .map((arg) =>
            typeof arg === 'object'
                ? util.inspect(arg, { colors: true, depth: null })
                : arg
        )
        .join(' ');

console.log = (...args) => logger.info(formatArgs(args))
console.info = (...args) => logger.info(formatArgs(args))
console.warn = (...args) => logger.warn(formatArgs(args))
console.error = (...args) => logger.error(formatArgs(args))

export default logger