# rtl-editor-backend/app/utils/command_executor.py
import asyncio
import subprocess

async def run_command(command: list, cwd: str = None, timeout: int = 120):
    """
    Runs a shell command asynchronously and captures its stdout/stderr.
    Args:
        command (list): The command and its arguments as a list (e.g., ["iverilog", "file.sv"]).
        cwd (str, optional): The current working directory for the command. Defaults to None.
        timeout (int, optional): Timeout in seconds for the command. Defaults to 120.
    Returns:
        dict: A dictionary containing stdout, stderr, and returncode.
    """
    try:
        process = await asyncio.create_subprocess_exec(
            *command,
            stdout=subprocess.PIPE,
            stderr=subprocess.PIPE,
            cwd=cwd
        )
        stdout, stderr = await asyncio.wait_for(process.communicate(), timeout=timeout)
        return {
            "stdout": stdout.decode(errors='ignore').strip(),
            "stderr": stderr.decode(errors='ignore').strip(),
            "returncode": process.returncode
        }
    except asyncio.TimeoutError:
        process.kill()
        await process.wait()
        return {
            "stdout": "",
            "stderr": f"Command timed out after {timeout} seconds.",
            "returncode": 1
        }
    except Exception as e:
        return {
            "stdout": "",
            "stderr": f"Error executing command: {e}",
            "returncode": 1
        }