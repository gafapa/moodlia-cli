param([Parameter(Mandatory = $true)][string]$Destination)
$ErrorActionPreference = 'Stop'
. D:/gallego.top/scripts/lib/server_hub.ps1
$configuration = Get-ServerHubConfiguration
$temporaryRoot = $null
try {
  $temporaryRoot = New-SecuredTemporaryDirectory -Prefix 'moodlia-webmcp-evidence'
  $privateKey = New-TemporarySshKey -Directory $temporaryRoot -AgeExecutable (Resolve-AgeExecutable) `
    -IdentityPath (Resolve-VaultIdentityPath -HubRoot $configuration.HubRoot) `
    -EncryptedKeyPath (Resolve-CredentialEncryptedPath -CredentialId $configuration.CredentialId -HubRoot $configuration.HubRoot)
  $options = Get-ScpOptions -Configuration $configuration -PrivateKeyPath $privateKey
  $endpoint = "$($configuration.User)@$($configuration.Host)"
  & scp @options "${endpoint}:/tmp/gallegotop-webmcp-evidence-20261015a.tgz" $Destination
  if ($LASTEXITCODE -ne 0) { throw 'Cannot retrieve the synthetic qualification evidence.' }
} finally {
  if ($temporaryRoot) {
    $resolved = [IO.Path]::GetFullPath($temporaryRoot)
    if (-not [IO.Path]::GetFileName($resolved).StartsWith('moodlia-webmcp-evidence')) { throw 'Unexpected temporary evidence directory.' }
    if (Test-Path -LiteralPath (Join-Path $resolved 'server.key')) { Remove-Item -LiteralPath (Join-Path $resolved 'server.key') }
    [IO.Directory]::Delete($resolved, $false)
  }
}
