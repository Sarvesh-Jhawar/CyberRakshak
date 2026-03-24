import requests
import json

BASE_URL = "http://127.0.0.1:8000"

def print_response(name, response):
    """Helper function to print API responses nicely."""
    print(f"--- Testing: {name} ---")
    if response.status_code == 200:
        print("Status: ✅ SUCCESS")
        print("Response:")
        print(json.dumps(response.json(), indent=2))
    else:
        print(f"Status: ❌ FAILED (HTTP {response.status_code})")
        try:
            print("Error Detail:")
            print(json.dumps(response.json(), indent=2))
        except json.JSONDecodeError:
            print(response.text)
    print("-" * (len(name) + 14) + "\n")

def test_phishing():
    test_cases = [
        {
            "name": "Phishing Email (Suspicious)",
            "data": {
                "subject": "Urgent: Verify Your Account",
                "body": "Please click this link to verify your login details http://secure-login-account-verification.com",
                "url": "http://secure-login-account-verification.com"
            }
        },
        {
            "name": "Phishing Email (Legitimate)",
            "data": {
                "subject": "Your order has shipped",
                "body": "Hi, your order #12345 has shipped. You can track it on our website.",
                "url": "https://www.example-store.com/tracking/12345"
            }
        },
        {
            "name": "Phishing SMS (Suspicious)",
            "data": {
                "subject": "",
                "body": "Your package has a customs fee. Pay now to avoid return: http://unpaid-customs-fee.com/payment",
                "url": "http://unpaid-customs-fee.com/payment"
            }
        },
        {
            "name": "Phishing URL (Suspicious Only)",
            "data": {
                "url": "http://bankofamerica-login-secure-update.com"
            }
        },
        {
            "name": "Phishing URL (Safe Only)",
            "data": {
                "url": "https://www.bbc.com/news"
            }
        },
        {
            "name": "Phishing Email (Fake Password Reset)",
            "data": {
                "subject": "Password Reset for your account",
                "body": "Someone requested a password reset. If this was not you, please secure your account here: http://facebook-support-team.com/reset",
                "url": "http://facebook-support-team.com/reset"
            }
        },
        {
            "name": "Phishing SMS (Fake Delivery)",
            "data": {
                "subject": "",
                "body": "Your package delivery failed. Please update your address here: http://fedex-tracking-updates.info",
                "url": "http://fedex-tracking-updates.info"
            }
        },
        {
            "name": "Phishing SMS (Legitimate Appointment)",
            "data": {
                "subject": "",
                "body": "Your appointment is confirmed for tomorrow at 2 PM. More details at https://myclinic.com/appointments",
                "url": "https://myclinic.com/appointments"
            }
        },
        {
            "name": "Phishing URL (IP Address)",
            "data": {
                "url": "http://203.0.113.10/admin/login.php"
            }
        },
        {
            "name": "Phishing URL (Subdomain Abuse)",
            "data": {
                "url": "https://login.microsoft.com.security-update-required.com/auth"
            }
        },
        {
            "name": "Phishing URL (Legitimate Deep Link)",
            "data": {
                "url": "https://en.wikipedia.org/wiki/Phishing"
            }
        }
    ]
    for case in test_cases:
        response = requests.post(f"{BASE_URL}/predict/phishing", json=case["data"])
        print_response(case["name"], response)

def test_malware():
    test_cases = [
        {
            "name": "Malware Process (Suspicious)",
            "data": {
                "millisecond": 0, "state": 0, "usage_counter": 0, "prio": 3069378560,
                "static_prio": 14274, "normal_prio": 0, "policy": 0, "vm_pgoff": 0,
                "vm_truncate_count": 13173, "task_size": 0, "cached_hole_size": 0,
                "free_area_cache": 24, "mm_users": 724, "map_count": 6850, "hiwater_rss": 0,
                "total_vm": 150, "shared_vm": 120, "exec_vm": 124, "reserved_vm": 210,
                "nr_ptes": 0, "end_data": 120, "last_interval": 3473, "nvcsw": 341974,
                "nivcsw": 0, "min_flt": 0, "maj_flt": 120, "fs_excl_counter": 0, "lock": 3204448256,
                "utime": 380690, "stime": 4, "gtime": 0, "cgtime": 0, "signal_nvcsw": 0
            }
        },
        {
            "name": "Malware Process (Benign)",
            "data": {
                "millisecond": 1500, "state": 0, "usage_counter": 1, "prio": 120,
                "static_prio": 20, "normal_prio": 0, "policy": 0, "vm_pgoff": 0,
                "vm_truncate_count": 5, "task_size": 1024, "cached_hole_size": 0,
                "free_area_cache": 10, "mm_users": 5, "map_count": 100, "hiwater_rss": 5000,
                "total_vm": 200, "shared_vm": 50, "exec_vm": 100, "reserved_vm": 50,
                "nr_ptes": 50, "end_data": 1024, "last_interval": 100, "nvcsw": 50,
                "nivcsw": 10, "min_flt": 100, "maj_flt": 0, "fs_excl_counter": 0, "lock": 0,
                "utime": 10, "stime": 1, "gtime": 0, "cgtime": 0, "signal_nvcsw": 0
            }
        }
    ]
    for case in test_cases:
        response = requests.post(f"{BASE_URL}/predict/malware", json=case["data"])
        print_response(case["name"], response)

def test_ransomware():
    test_cases = [
        {
            "name": "Ransomware PE File (Suspicious)",
            "data": {
                "ApiVector": 1, "DllVector": 1, "NumberOfSections": 5, "CreationYear": 2021,
                "SizeOfCode": 51200,
                "SizeOfInitializedData": 10240,
                "AddressOfEntryPoint": 4096,
                "ImageBase": 4194304,
                "SectionAlignment": 4096,
                "FileAlignment": 512,
                "SizeOfImage": 81920,
                "SizeOfHeaders": 1024,
                "Checksum": 0,
                "DllCharacteristics_y": 34112,
                "SizeOfStackReserve": 1048576,
                "resources_mean_entropy": 3.5,
                "sus_sections": 2, "packer": 1, "E_text": 6.5, "E_data": 4.2,
                "OsVersion": "10.0", "Subsystem": "WindowsGUI", "Machine": "I386"
            }
        },
        {
            "name": "Ransomware PE File (Benign)",
            "data": {
                "ApiVector": 0, "DllVector": 0, "NumberOfSections": 3, "CreationYear": 2019,
                "SizeOfCode": 10240,
                "SizeOfInitializedData": 2048,
                "AddressOfEntryPoint": 2048,
                "ImageBase": 4194304,
                "SectionAlignment": 4096,
                "FileAlignment": 512,
                "SizeOfImage": 20480,
                "SizeOfHeaders": 1024,
                "Checksum": 12345,
                "DllCharacteristics_y": 0,
                "SizeOfStackReserve": 1048576,
                "resources_mean_entropy": 2.5,
                "sus_sections": 0, "packer": 0, "E_text": 5.5, "E_data": 3.1,
                "OsVersion": "10.0", "Subsystem": "WindowsGUI", "Machine": "I386"
            }
        }
    ]
    for case in test_cases:
        response = requests.post(f"{BASE_URL}/predict/ransomware", json=case["data"])
        print_response(case["name"], response)

def test_networking():
    test_cases = [
        {
            "name": "Network Traffic (Anomaly)",
            "data": {
                "duration": 0, "protocol_type": "tcp", "service": "private", "flag": "S0",
                "src_bytes": 0, "dst_bytes": 0, "land": 0, "wrong_fragment": 0,
                "urgent": 0, "hot": 0, "num_failed_logins": 0, "logged_in": 0,
                "num_compromised": 0, "root_shell": 0, "su_attempted": 0, "num_root": 0,
                "num_file_creations": 0, "num_shells": 0, "num_access_files": 0,
                "num_outbound_cmds": 0, "is_host_login": 0, "is_guest_login": 0,
                "count": 200, "srv_count": 10, "serror_rate": 1.0, "srv_serror_rate": 1.0,
                "rerror_rate": 0.0, "srv_rerror_rate": 0.0, "same_srv_rate": 0.05,
                "diff_srv_rate": 0.07, "srv_diff_host_rate": 0.0, "dst_host_count": 255,
                "dst_host_srv_count": 10, "dst_host_same_srv_rate": 0.04,
                "dst_host_diff_srv_rate": 0.05, "dst_host_same_src_port_rate": 0.0,
                "dst_host_srv_diff_host_rate": 0.0, "dst_host_serror_rate": 1.0,
                "dst_host_srv_serror_rate": 1.0, "dst_host_rerror_rate": 0.0,
                "dst_host_srv_rerror_rate": 0.0
            }
        },
        {
            "name": "Network Traffic (Normal)",
            "data": {
                "duration": 2, "protocol_type": "tcp", "service": "http", "flag": "SF",
                "src_bytes": 215, "dst_bytes": 45076, "land": 0, "wrong_fragment": 0,
                "urgent": 0, "hot": 0, "num_failed_logins": 0, "logged_in": 1,
                "num_compromised": 0, "root_shell": 0, "su_attempted": 0, "num_root": 0,
                "num_file_creations": 0, "num_shells": 0, "num_access_files": 0,
                "num_outbound_cmds": 0, "is_host_login": 0, "is_guest_login": 0,
                "count": 1, "srv_count": 1, "serror_rate": 0.0, "srv_serror_rate": 0.0,
                "rerror_rate": 0.0, "srv_rerror_rate": 0.0, "same_srv_rate": 1.0,
                "diff_srv_rate": 0.0, "srv_diff_host_rate": 0.0, "dst_host_count": 1,
                "dst_host_srv_count": 1, "dst_host_same_srv_rate": 1.0,
                "dst_host_diff_srv_rate": 0.0, "dst_host_same_src_port_rate": 1.0,
                "dst_host_srv_diff_host_rate": 0.0, "dst_host_serror_rate": 0.0,
                "dst_host_srv_serror_rate": 0.0, "dst_host_rerror_rate": 0.0,
                "dst_host_srv_rerror_rate": 0.0
            }
        }
    ]
    for case in test_cases:
        response = requests.post(f"{BASE_URL}/predict/networking", json=case["data"])
        print_response(case["name"], response)

def test_zero_day():
    test_cases = [
        {
            "name": "Zero-Day Event (Suspicious)",
            "data": {
                "protocol": "TCP", "flag": "SYN", "family": "MalwareA",
                "seddaddress": "192.168.1.100", "expaddress": "10.0.0.5",
                "ip address": "192.168.1.100", "user-agent": "Mozilla/5.0",
                "geolocation": "US", "event description": "Suspicious outbound connection",
                "duration": 5, "src_bytes": 0, "dst_bytes": 0, "land": 0, "wrong_fragment": 0,
                "urgent": 0, "hot": 0, "num_failed_logins": 0, "logged_in": 0,
                "num_compromised": 0, "root_shell": 0, "su_attempted": 0, "num_root": 0,
                "count": 100, "srv_count": 1, "serror_rate": 1.0, "srv_serror_rate": 1.0,
                "anomaly score": 0.9, "session id": "session-xyz", "time": 1672531200,
                "error code": 1, "logistics id": "log-xyz", "number of packets": 10,
                "netflow bytes": 0, "response time": 5.0, "data transfer rate": 0.0,
                "clusters": 3, "port": 80, "prediction": "unknown", "usd": 0.0,
                "application layer data": "unknown", "payload size": 0, "btc": 0.0
            }
        },
        {
            "name": "Zero-Day Event (Normal)",
            "data": {
                "protocol": "TCP", "flag": "SF", "family": "unknown",
                "seddaddress": "192.168.1.50", "expaddress": "8.8.8.8",
                "ip address": "192.168.1.50", "user-agent": "Chrome/108.0.0.0",
                "geolocation": "US", "event description": "DNS query",
                "duration": 0, "src_bytes": 60, "dst_bytes": 120, "land": 0, "wrong_fragment": 0,
                "urgent": 0, "hot": 0, "num_failed_logins": 0, "logged_in": 0,
                "num_compromised": 0, "root_shell": 0, "su_attempted": 0, "num_root": 0,
                "count": 1, "srv_count": 1, "serror_rate": 0.0, "srv_serror_rate": 0.0,
                "anomaly score": 0.1, "session id": "session-123", "time": 1672531200,
                "error code": 0, "logistics id": "log-abc", "number of packets": 2,
                "netflow bytes": 180, "response time": 0.05, "data transfer rate": 3600,
                "clusters": 0, "port": 53, "prediction": "normal", "usd": 0.0,
                "application layer data": "dns.query.google.com", "payload size": 30, "btc": 0.0
            }
        }
    ]
    for case in test_cases:
        response = requests.post(f"{BASE_URL}/predict/zero-day", json=case["data"])
        print_response(case["name"], response)

if __name__ == "__main__":
    # Check if the server is running
    try:
        health_check = requests.get(f"{BASE_URL}/")
        if health_check.status_code != 200:
            print(f"API server is not responding at {BASE_URL}. Please start it first.")
        else:
            print("API Server is running. Starting tests...\n")
            test_phishing()
            test_malware()
            test_ransomware()
            test_networking()
            test_zero_day()
    except requests.exceptions.ConnectionError:
        print(f"Could not connect to the API server at {BASE_URL}.")
        print("Please make sure the server is running with the command:")
        print("uvicorn api.main:app --reload")