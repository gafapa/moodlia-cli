param([int]$Port = 18097)
$ErrorActionPreference = 'Stop'
. D:/gallego.top/scripts/lib/server_hub.ps1
$configuration = Get-ServerHubConfiguration
$temporaryRoot = $null
try {
  $temporaryRoot = New-SecuredTemporaryDirectory -Prefix 'moodlia-webmcp-ssh'
  $privateKey = New-TemporarySshKey -Directory $temporaryRoot -AgeExecutable (Resolve-AgeExecutable) `
    -IdentityPath (Resolve-VaultIdentityPath -HubRoot $configuration.HubRoot) `
    -EncryptedKeyPath (Resolve-CredentialEncryptedPath -CredentialId $configuration.CredentialId -HubRoot $configuration.HubRoot)
  $options = Get-SshOptions -Configuration $configuration -PrivateKeyPath $privateKey
  & ssh @options -N -o ExitOnForwardFailure=yes -o ServerAliveInterval=30 `
    -L "127.0.0.1:${Port}:127.0.0.1:18097" "$($configuration.User)@$($configuration.Host)"
} finally {
  if ($temporaryRoot) {
    $resolved = [IO.Path]::GetFullPath($temporaryRoot)
    if (-not [IO.Path]::GetFileName($resolved).StartsWith('moodlia-webmcp-ssh')) { throw 'Unexpected SSH temporary directory.' }
    if (Test-Path -LiteralPath (Join-Path $resolved 'server.key')) { Remove-Item -LiteralPath (Join-Path $resolved 'server.key') }
    [IO.Directory]::Delete($resolved, $false)
  }
}
