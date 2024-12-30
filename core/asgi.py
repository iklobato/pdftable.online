import os
os.environ.setdefault("DJANGO_SETTINGS_MODULE", "core.settings")

import django 
django.setup()

from django.urls import path
from django.core.asgi import get_asgi_application
from channels.routing import ProtocolTypeRouter, URLRouter
from channels.auth import AuthMiddlewareStack

from api.consumers import PDFConsumer

websocket_urlpatterns = [
   path("ws/pdf/", PDFConsumer.as_asgi()),
]

application = ProtocolTypeRouter({
    "http": get_asgi_application(),
    "websocket": AuthMiddlewareStack(
        URLRouter(websocket_urlpatterns)
    )
})

