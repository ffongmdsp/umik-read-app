console.log('Renderer running');

window.addEventListener('load', (event) => {
   document.getElementById('start_button').addEventListener('click', startRecord);
   document.getElementById('stop_button').addEventListener('click', stopRecord);
  });

function startRecord()
{
    document.getElementById("start_button").disabled = true;
    document.getElementById("stop_button").disabled = false;
    document.getElementById('duration_val').innerText = '0';
    document.getElementById('state_val').innerText = 'Starting';
    window.electron.request_start_record();
}

function stopRecord()
{
    document.getElementById("start_button").disabled = false;
    document.getElementById("stop_button").disabled = true;
    document.getElementById('state_val').innerText = 'Stopping';
    window.electron.request_stop_record();
}
