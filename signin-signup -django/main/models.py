from django.db import models

# Create your models here.
class database(models.Model):
    firstname = models.CharField(max_length=30 )
    lastname = models.CharField(max_length=30)
    username = models.CharField(max_length=100)
    password = models.CharField(max_length=100)

    def __str__(self):
        return self.username