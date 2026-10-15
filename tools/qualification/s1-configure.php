<?php
// Configure only the disposable Moodle instance owned by this validation run.
$root = '/var/www/html';
$public = is_dir($root . '/public') ? $root . '/public' : $root;
$configuration = '<?php' . PHP_EOL . <<<'CONFIG'
unset($CFG);
global $CFG;
$CFG = new stdClass();
$CFG->dbtype = 'pgsql';
$CFG->dblibrary = 'native';
$CFG->dbhost = 'database';
$CFG->dbname = 'moodleqa';
$CFG->dbuser = getenv('POSTGRES_USER');
$CFG->dbpass = getenv('POSTGRES_PASSWORD');
$CFG->prefix = 'mdl_';
$CFG->dboptions = ['dbpersist' => false, 'dbport' => 5432];
$CFG->wwwroot = 'http://127.0.0.1:18097';
$CFG->reverseproxy = true;
$CFG->dataroot = '/qa/data';
$CFG->directorypermissions = 0700;
$CFG->admin = 'admin';
$CFG->phpunit_prefix = 'phpu_';
$CFG->phpunit_dataroot = '/qa/phpunit-data';
$CFG->passwordpolicy = 0;
$CFG->supportemail = 'qa@example.invalid';
$CFG->noreplyaddress = 'noreply@example.invalid';
$CFG->noemailever = true;
$CFG->disableupdatenotifications = true;
require_once(__DIR__ . '/lib/setup.php');
CONFIG;
if (!is_dir($root . '/public')) {
    $configuration = str_replace("'/qa/data'", "'/qa/data45'", $configuration);
    $configuration = str_replace("'/qa/phpunit-data'", "'/qa/phpunit-data45'", $configuration);
}
file_put_contents($public . '/config.php', $configuration . PHP_EOL);
chmod($public . '/config.php', 0600);
if ($public !== $root) {
    file_put_contents($root . '/config.php', "<?php\nrequire(__DIR__ . '/public/config.php');\n");
    chmod($root . '/config.php', 0600);
}
