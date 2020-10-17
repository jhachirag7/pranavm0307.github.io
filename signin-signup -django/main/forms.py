from django import forms

from .models import database

class add_newuser(forms.ModelForm):
	class Meta:
		model = database
		fields = [
	    	'username' ,
	    	'password',
			'firstname',
			'lastname'
		]