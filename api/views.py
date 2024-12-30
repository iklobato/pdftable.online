from django.views import View
from django.shortcuts import render
from django.http import JsonResponse


class HomeView(View):
    def get(self, request):
        return render(request, 'index.html')


class PDFProcessView(View):
   def post(self, request):
       return JsonResponse({
           "status": "success", 
           "message": "PDF processing moved to WebSocket connection"
       })

