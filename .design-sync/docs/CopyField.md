A value to be read and taken away — a repository URL, a token, a command.
It shows the value in the mono face and copies it on request, confirming
on the button itself.

A write refused — outside a secure context, or where the permission is
denied — leaves the button at rest rather than confirming, and calls
`onCopyFailed`.
