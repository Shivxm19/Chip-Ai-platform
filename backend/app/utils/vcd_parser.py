# rtl-editor-backend/app/utils/vcd_parser.py
# Corrected import: Import tokenize and other necessary components from vcd.reader
from vcd.reader import tokenize, TokenKind, VarDecl, ScalarChange, VectorChange
from typing import List, Dict, Any
import io # Needed for opening file in binary mode for tokenize

def parse_vcd_to_json(vcd_filepath: str) -> List[Dict[str, Any]]:
    """
    Parses a VCD file using pyvcd and converts it into a list of dictionaries
    suitable for the frontend's waveformSignals format.

    Args:
        vcd_filepath (str): Path to the VCD file.

    Returns:
        list: A list of signal data, e.g.,
              [{"name": "clk", "values": [0, 1, ...], "timestamps": [0, 10, ...]}, ...]
    """
    waveform_signals = []
    try:
        # Open the VCD file in binary read mode ('rb') as tokenize expects bytes
        with open(vcd_filepath, 'rb') as f:
            signals_by_id = {}
            current_time = 0

            # Iterate through the tokens yielded by the tokenize function
            for token in tokenize(f):
                if token.kind is TokenKind.VAR:
                    # Process variable declaration tokens
                    var_decl: VarDecl = token.var # Access the VarDecl NamedTuple from the token
                    full_name = var_decl.ref_str # Use the ref_str property for the full signal name
                    
                    signals_by_id[var_decl.id_code] = {
                        "name": full_name,
                        "id": var_decl.id_code,
                        "values": [],
                        "timestamps": [],
                        "size": var_decl.size
                    }
                elif token.kind is TokenKind.CHANGE_TIME:
                    # Update current simulation time
                    current_time = token.time_change # Access the time_change property from the token
                elif token.kind is TokenKind.CHANGE_SCALAR:
                    # Process scalar value changes (single bit: '0', '1', 'X', 'Z')
                    change: ScalarChange = token.scalar_change
                    if change.id_code in signals_by_id:
                        signal = signals_by_id[change.id_code]
                        processed_value = 0 # Default for 'x'/'z' or invalid
                        if change.value == '0': processed_value = 0
                        elif change.value == '1': processed_value = 1
                        signal["values"].append(processed_value)
                        signal["timestamps"].append(current_time)
                elif token.kind is TokenKind.CHANGE_VECTOR:
                    # Process vector value changes (multi-bit)
                    change: VectorChange = token.vector_change
                    if change.id_code in signals_by_id:
                        signal = signals_by_id[change.id_code]
                        processed_value = 0
                        if isinstance(change.value, int):
                            processed_value = change.value
                        else: # String value (contains 'x' or 'z' for unknown/high-impedance)
                            try:
                                # Convert binary string (with 'x'/'z' replaced by '0') to integer
                                processed_value = int(change.value.replace('x', '0').replace('z', '0'), 2)
                            except ValueError:
                                processed_value = 0 # Fallback for unparsable values
                        signal["values"].append(processed_value)
                        signal["timestamps"].append(current_time)
                # Add handling for other change types (RealChange, StringChange) if your VCDs contain them
                # elif token.kind is TokenKind.CHANGE_REAL:
                #     change: RealChange = token.real_change
                #     if change.id_code in signals_by_id:
                #         signal = signals_by_id[change.id_code]
                #         signal["values"].append(change.value)
                #         signal["timestamps"].append(current_time)
                # elif token.kind is TokenKind.CHANGE_STRING:
                #     change: StringChange = token.string_change
                #     if change.id_code in signals_by_id:
                #         signal = signals_by_id[change.id_code]
                #         signal["values"].append(change.value)
                #         signal["timestamps"].append(current_time)

            # Convert the dictionary of signals to a list for the final output
            waveform_signals = list(signals_by_id.values())

    except FileNotFoundError:
        print(f"VCD file not found: {vcd_filepath}")
        return []
    except Exception as e:
        print(f"Error parsing VCD file '{vcd_filepath}': {e}")
        return []

    return waveform_signals