# Notification Sounds Directory

This directory is for notification sound files. The notification system supports two types of sounds:

- `notification-message.mp3` - Sound for new chat messages
- `notification-ticket.mp3` - Sound for ticket changes and new tickets

## Optional Files

**Note:** Sound files are optional. If these files are not present, the system will automatically generate fallback beep sounds using the Web Audio API.

If you want to add custom notification sounds:

1. Place `notification-message.mp3` and `notification-ticket.mp3` in this directory
2. Keep files small (< 50KB recommended) for fast loading
3. Use MP3 or WAV format
4. Files will be automatically loaded by the sound manager

## Fallback Behavior

If sound files are not available, the system will generate simple beep sounds:
- Message notifications: 800Hz beep (200ms duration)
- Ticket notifications: 600Hz beep (200ms duration)

