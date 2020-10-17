from django.contrib import admin

# Register your models here.
from .models import database
admin.site.site_header = "User Databse Admin"
admin.site.site_title = "User Database Admin Area"
admin.site.index_title = "Welcome to User Database Admin Area"

admin.site.register(database)
