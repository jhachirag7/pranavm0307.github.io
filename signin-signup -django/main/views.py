from django.shortcuts import render
from django.http import HttpResponse
from django.views.decorators.csrf import csrf_exempt

from .models import database
from .forms import add_newuser

# Create your views here.
def login_form(request):
    return render(request, "login.html")

def landing_page(request):
    return render(request, "index.html")

@csrf_exempt
def submit_form(request):
    username = request.POST["username"]
    password = request.POST["password"]
    if username == "rishabh" and password == "rishabh":
        return HttpResponse("welcome")
    elif username == "pvm" and password == "pvm":
        return HttpResponse("welcome")
    elif username == "jonty" and password == "jonty":
        return HttpResponse("welcome")
    elif username == "pranavm03" and password == "pranavm03":
        return HttpResponse("welcome")
    elif username == "pranavm07" and password == "pranavm07":
        return HttpResponse("welcome")
    else:
        return HttpResponse('IN-Valid')        

@csrf_exempt
def addnewuser(request):
    form = add_newuser(request.POST or None)
    if form.is_valid():
        form.save()
        form = add_newuser()
    context = {
        "form" : form
    }
    return render(request, "signup.html", context)