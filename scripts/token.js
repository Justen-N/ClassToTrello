function init(){
 console.log('init called');
 var form = $('#tokenSubmit')
    form.submit(()=>{
    var token;
    token = $('#token').val();
    if(token){
        localStorage.setItem("canvas_token", token);
        window.close();
    }
    else{
        $('#empty_token').css('display','initial');
        return false;
    }
})
}
$(document).ready(init);