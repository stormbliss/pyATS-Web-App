from typing import Tuple, List

def validate_testbed(testbed_data: dict) -> Tuple[bool, List[str]]:
    """
    Validate testbed YAML structure
    Returns: (is_valid, list_of_errors)
    """
    errors = []
    
    # Check if testbed key exists
    if 'testbed' not in testbed_data:
        errors.append("Missing 'testbed' key in YAML")
        return False, errors
    
    testbed = testbed_data['testbed']
    
    # Check testbed name
    if 'name' not in testbed:
        errors.append("Missing 'name' in testbed section")
    
    # Check devices
    if 'devices' not in testbed_data:
        errors.append("Missing 'devices' section")
        return False, errors
    
    devices = testbed_data['devices']
    
    if not devices or not isinstance(devices, dict):
        errors.append("'devices' section must be a non-empty dictionary")
        return False, errors
    
    # Validate each device
    for device_name, device_config in devices.items():
        if not isinstance(device_config, dict):
            errors.append(f"Device '{device_name}' configuration must be a dictionary")
            continue
        
        # Check required fields
        required_fields = ['os', 'connections']
        for field in required_fields:
            if field not in device_config:
                errors.append(f"Device '{device_name}' missing required field: '{field}'")
        
        # Validate connections
        if 'connections' in device_config:
            connections = device_config['connections']
            if not isinstance(connections, dict):
                errors.append(f"Device '{device_name}' connections must be a dictionary")
            else:
                for conn_name, conn_config in connections.items():
                    if 'ip' not in conn_config:
                        errors.append(f"Device '{device_name}' connection '{conn_name}' missing 'ip'")
                    if 'protocol' not in conn_config:
                        errors.append(f"Device '{device_name}' connection '{conn_name}' missing 'protocol'")
    
    # Check credentials
    if 'credentials' not in testbed:
        errors.append("Warning: No credentials defined in testbed (consider adding default credentials)")
    
    is_valid = len(errors) == 0
    return is_valid, errors
