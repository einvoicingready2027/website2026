<?php
/**
 * proxy.php - Sicherer Vermittler für eRechnungswerk
 * 
 * Dieses Script versteckt den n8n API-Key vor den Augen der Nutzer.
 * Die Webseite sendet Daten an dieses Script, und dieses Script
 * leitet sie mit dem geheimen Key an n8n weiter.
 */

// --- KONFIGURATION ---
$n8n_webhook_url = 'https://n8n.srv1622881.hstgr.cloud/webhook-test/4a554bdc-c0cb-4f61-bb5c-f5360e5bc53c';
$api_key = 'sasdjkKSAKLASKxx191##91921jasdkskaAKKAKSJD19111dasda';
// ----------------------

// CORS-Header für IONOS Stabilität
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, x-api-key");

// Handle OPTIONS Preflight
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

// Nur POST-Anfragen erlauben
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    exit('Method Not Allowed');
}

// Eingehende Daten lesen
$input_data = file_get_contents('php://input');

// cURL Initialisierung
$ch = curl_init($n8n_webhook_url);
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
curl_setopt($ch, CURLOPT_POST, true);
curl_setopt($ch, CURLOPT_POSTFIELDS, $input_data);
curl_setopt($ch, CURLOPT_HTTPHEADER, [
    'Content-Type: application/json',
    'x-api-key: ' . $api_key
]);

// Anfrage ausführen
$response = curl_exec($ch);
$http_code = curl_getinfo($ch, CURLINFO_HTTP_CODE);
$error = curl_error($ch);

curl_close($ch);

// Fehlerbehandlung
if ($response === false) {
    http_response_code(500);
    echo json_encode(['error' => 'Proxy Error', 'details' => $error]);
    exit;
}

// Ergebnis an Browser zurückgeben
http_response_code($http_code);
header('Content-Type: application/json');
echo $response;
?>
