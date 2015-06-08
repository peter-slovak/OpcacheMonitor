<?php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');

if (!function_exists('opcache_get_status')) {
    http_response_code(404);
    $result = array('error' => 'OPcache is not enabled');
}
else {
    $stats = opcache_get_status();
    $shm_size = $stats['memory_usage']['used_memory'] + $stats['memory_usage']['free_memory'];
    $max_shm_size = 2 * 1024 * 1024 * 1024;

    if ($shm_size > $max_shm_size and PHP_VERSION_ID < 50610) {
        http_response_code(404);
        $result = array('error' => 'Cache size over 2GB and PHP version lower than 5.6.10 (there are known bugs).\
                                    Please reset by other means.');
    }
    else {
        $result = opcache_reset();

        if ($result) {
            http_response_code(200);
            $result = array('status' => 'success');
        }
        else {
            http_response_code(404);
            $result = array('error' => 'Opcache reset failed');
        }
    }
}

echo json_encode($result, JSON_PRETTY_PRINT);