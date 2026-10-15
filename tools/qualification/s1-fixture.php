<?php
// Create exclusively synthetic users and content in the owned loopback lab.
define('CLI_SCRIPT', true);
require('/var/www/html/config.php');
if ($CFG->wwwroot !== 'http://127.0.0.1:18097' || !in_array($CFG->dataroot, ['/qa/data', '/qa/data45'], true)) {
    throw new RuntimeException('Unexpected lab instance.');
}
require_once($CFG->dirroot . '/course/lib.php');
require_once($CFG->dirroot . '/lib/enrollib.php');
require_once($CFG->dirroot . '/user/lib.php');
$admin = get_admin();
\core\session\manager::set_user($admin);
$password = bin2hex(random_bytes(24));
update_internal_user_password($admin, $password);
set_config('webmcp_enabled', 1, 'local_moodlia');
set_config('cachejs', 0);
set_config('registerauth', '');
set_config('sitepolicy', '');
$admin->firstname = 'Synthetic';
$admin->lastname = 'Administrator';
$admin->email = 'qa@example.invalid';
$admin->country = 'ES';
$admin->city = 'Synthetic QA';
user_update_user($admin, false, false);
unset_user_preference('auth_forcepasswordchange', $admin);
$course = create_course((object) [
    'fullname' => 'Synthetic WebMCP validation áéíóú', 'shortname' => 'WEBMCP-QA',
    'category' => $DB->get_field('course_categories', 'id', [], IGNORE_MULTIPLE),
    'format' => 'topics', 'numsections' => 2, 'enablecompletion' => 1,
]);
$othercourse = create_course((object) [
    'fullname' => 'Synthetic separate WebMCP course', 'shortname' => 'WEBMCP-QA-OTHER',
    'category' => $course->category, 'format' => 'topics', 'numsections' => 1,
]);
$student = (object) [
    'username' => 'qastudent', 'auth' => 'manual', 'confirmed' => 1,
    'mnethostid' => $CFG->mnet_localhost_id,
    'firstname' => 'Synthetic', 'lastname' => 'Student', 'email' => 'student@example.invalid',
    'country' => 'ES', 'city' => 'Synthetic QA', 'password' => bin2hex(random_bytes(24)),
];
$studentpassword = $student->password;
$student->id = user_create_user($student, true, false);
$roleid = create_role('Synthetic WebMCP transport', 'webmcpqa', 'Synthetic transport-only test role');
assign_capability('local/moodlia:useapi', CAP_ALLOW, $roleid, \context_system::instance());
role_assign($roleid, $student->id, \context_system::instance());
$studentrole = $DB->get_record('role', ['shortname' => 'student'], '*', MUST_EXIST);
$plugin = enrol_get_plugin('manual');
$instances = enrol_get_instances($course->id, true);
foreach ($instances as $instance) {
    if ($instance->enrol === 'manual') {
        $plugin->enrol_user($instance, $student->id, $studentrole->id);
        break;
    }
}
$fixture = [
    'url' => $CFG->wwwroot, 'username' => $admin->username, 'password' => $password,
    'course_id' => (int) $course->id, 'student_username' => $student->username,
    'other_course_id' => (int) $othercourse->id,
    'student_password' => $studentpassword, 'student_id' => (int) $student->id,
];
file_put_contents('/qa/fixture.json', json_encode($fixture, JSON_THROW_ON_ERROR));
chmod('/qa/fixture.json', 0600);
echo "Synthetic fixture ready.\n";
