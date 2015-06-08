<?php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');

if (!function_exists('opcache_get_status')) {
    http_response_code(404);
    $result = array('error' => 'OPcache is not enabled');
}
else {
    $result = opcache_get_status(false);

    if ($result) {
    	http_response_code(200);
    }
    else {
    	http_response_code(404);
        $result = array('error' => 'Opcache status listing failed');
    }
}

echo json_encode($result, JSON_PRETTY_PRINT);