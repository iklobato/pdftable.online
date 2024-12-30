from django.contrib import admin
from django.urls import path
from django.conf.urls.static import static
from django.conf import settings

from api.views import HomeView, PDFProcessView

urlpatterns = [
    path("admin/", admin.site.urls),
    # home page
    path("", HomeView.as_view(), name="home"),
    # pdf process view
    path("process-pdf/", PDFProcessView.as_view(), name="pdf-process"),
] + static(settings.STATIC_URL, document_root=settings.STATIC_ROOT)

