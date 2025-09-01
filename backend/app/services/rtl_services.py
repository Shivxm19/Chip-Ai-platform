# rtl-editor-backend/app/services/rtl_service.py
import os
from app.utils.command_executor import run_command
from app.utils.file_manager import create_temp_dir, cleanup_temp_dir
from app.utils.vcd_parser import parse_vcd_to_json
from app.models.common import ToolResponse

async def run_lint(rtl_code: str, file_name: str) -> ToolResponse:
    """
    Runs Verilator for linting the provided RTL code.
    """
    temp_dir = create_temp_dir()
    file_path = os.path.join(temp_dir, file_name)

    try:
        with open(file_path, "w") as f:
            f.write(rtl_code)

        # Using Verilator for more comprehensive linting
        command = ["verilator", "--lint-only", "--Wno-DECLFILENAME", file_name]
        result = await run_command(command, cwd=temp_dir)

        full_log = result["stdout"] + "\n" + result["stderr"]
        success = result["returncode"] == 0 and "Error" not in result["stderr"]
        message = "Linting successful!" if success else "Linting failed. Check log."
        if "Warning" in result["stderr"]:
            message = "Linting completed with warnings."

        return ToolResponse(success=success, log=full_log, message=message)
    finally:
        cleanup_temp_dir(temp_dir)

async def run_synthesize(rtl_code: str, file_name: str) -> ToolResponse:
    """
    Runs Yosys for synthesizing the provided RTL code.
    """
    temp_dir = create_temp_dir()
    rtl_file_path = os.path.join(temp_dir, file_name)
    output_netlist_path = os.path.join(temp_dir, "netlist.v")
    yosys_script_path = os.path.join(temp_dir, "synth.ys")

    try:
        with open(rtl_file_path, "w") as f:
            f.write(rtl_code)

        yosys_script_content = f"""
        read_verilog {file_name}
        synth
        write_verilog {os.path.basename(output_netlist_path)}
        """
        with open(yosys_script_path, "w") as f:
            f.write(yosys_script_content)

        command = ["yosys", "-s", os.path.basename(yosys_script_path)]
        result = await run_command(command, cwd=temp_dir)

        full_log = result["stdout"] + "\n" + result["stderr"]
        success = result["returncode"] == 0 and os.path.exists(output_netlist_path)
        message = "Synthesis successful!" if success else "Synthesis failed. Check log."

        if success:
            with open(output_netlist_path, "r") as f:
                netlist_content = f.read()
            full_log += f"\n\n--- Synthesized Netlist ({os.path.basename(output_netlist_path)}) ---\n{netlist_content}"

        return ToolResponse(success=success, log=full_log, message=message)
    finally:
        cleanup_temp_dir(temp_dir)

async def run_simulate(rtl_code: str, file_name: str) -> ToolResponse:
    """
    Runs Icarus Verilog simulation for the provided RTL code.
    Generates a VCD file and parses it for waveform visualization.
    """
    temp_dir = create_temp_dir()
    rtl_file_path = os.path.join(temp_dir, file_name)
    testbench_file_path = os.path.join(temp_dir, "testbench.sv")
    vcd_output_path = os.path.join(temp_dir, "dump.vcd")
    simulation_executable = os.path.join(temp_dir, "sim.vvp")

    # --- IMPORTANT: Testbench Strategy ---
    # This is a VERY basic hardcoded testbench. For a real application:
    # 1. Allow user to upload their own testbench file.
    # 2. Use AI to generate a testbench based on the user's RTL module.
    # 3. Parse the user's RTL to dynamically create an instantiation and simple stimuli.
    # For this example, we assume a top module named 'my_adder' in the user's RTL.
    testbench_content = f"""
    `timescale 1ns / 1ps
    module testbench;
        logic [7:0] a_tb, b_tb;
        logic [8:0] sum_tb;
        logic clk_tb, rst_n_tb;

        // Instantiate the user's top module.
        // You might need to dynamically extract the module name from rtl_code.
        // For this example, we assume 'my_adder'.
        my_adder dut (
            .a(a_tb),
            .b(b_tb),
            .sum(sum_tb)
        );

        initial begin
            clk_tb = 0;
            rst_n_tb = 0;
            #10 rst_n_tb = 1; // Release reset

            a_tb = 8'h00; b_tb = 8'h00; #10;
            a_tb = 8'h01; b_tb = 8'h01; #10;
            a_tb = 8'hFF; b_tb = 8'h01; #10; // Example: overflow
            a_tb = 8'h7F; b_tb = 8'h7F; #10; // Example: large numbers
            a_tb = 8'hAA; b_tb = 8'hBB; #10; // Example: arbitrary numbers

            $display("Simulation finished at %0t.", $time);
            $finish; // End simulation
        end

        always #5 clk_tb = ~clk_tb; // 10ns period clock

        // Dump waveforms to VCD file
        initial begin
            $dumpfile("{os.path.basename(vcd_output_path)}");
            $dumpvars(0, testbench);
        end
    endmodule
    """

    try:
        with open(rtl_file_path, "w") as f:
            f.write(rtl_code)
        with open(testbench_file_path, "w") as f:
            f.write(testbench_content)

        # 1. Compile RTL and Testbench using iverilog
        compile_cmd = ["iverilog", "-o", os.path.basename(simulation_executable), file_name, os.path.basename(testbench_file_path)]
        compile_result = await run_command(compile_cmd, cwd=temp_dir)

        if compile_result["returncode"] != 0:
            return ToolResponse(
                success=False,
                log=compile_result["stdout"] + "\n" + compile_result["stderr"],
                message="Simulation compilation failed. Check log."
            )

        # 2. Run Simulation using vvp
        sim_cmd = ["vvp", os.path.basename(simulation_executable)]
        sim_result = await run_command(sim_cmd, cwd=temp_dir)

        full_log = compile_result["stdout"] + "\n" + compile_result["stderr"] + "\n" + \
                   sim_result["stdout"] + "\n" + sim_result["stderr"]

        success = sim_result["returncode"] == 0
        message = "Simulation completed!" if success else "Simulation failed. Check log."

        waveforms = []
        if success and os.path.exists(vcd_output_path):
            try:
                waveforms = parse_vcd_to_json(vcd_output_path)
                message += " Waveforms generated."
            except Exception as e:
                full_log += f"\nError parsing VCD: {e}"
                message += " (VCD parsing failed)"
                success = False # Consider VCD parsing failure as a partial failure
        else:
            full_log += "\nNo VCD file generated or simulation failed."

        return ToolResponse(success=success, log=full_log, message=message, waveformData=waveforms)
    finally:
        cleanup_temp_dir(temp_dir)