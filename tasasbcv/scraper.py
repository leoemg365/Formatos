import requests
from bs4 import BeautifulSoup
import json
import os
from datetime import datetime

def obtener_tasas_bcv():
    # URL oficial del Banco Central de Venezuela
    url = "https://www.bcv.org.ve/"
    
    # El User-Agent es vital para que el BCV no bloquee la petición
    headers = {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
    }
    
    try:
        # Hacemos la petición (verify=False ignora errores de certificado SSL comunes en sitios gubernamentales)
        response = requests.get(url, headers=headers, verify=False, timeout=25)
        response.raise_for_status()
        
        soup = BeautifulSoup(response.content, 'html.parser')

        # Estructura base del JSON
        data_final = {
            "info": {
                "fuente": "Banco Central de Venezuela",
                "web": "https://www.bcv.org.ve",
                "ultima_consulta": datetime.now().strftime("%d/%m/%Y %I:%M %p")
            },
            "tasas": {}
        }

        # Mapeo de los IDs de la web del BCV a nombres clave para tus apps
        monedas = {
            'dolar': 'USD',
            'euro': 'EUR',
            'yuan': 'CNY',
            'lira': 'TRY',
            'rublo': 'RUB'
        }
        
        for id_html, codigo in monedas.items():
            contenedor = soup.find('div', id=id_html)
            if contenedor:
                # Extraemos el número, quitamos espacios y cambiamos coma por punto
                valor_texto = contenedor.find('strong').text.strip()
                valor_float = float(valor_texto.replace(',', '.'))
                data_final["tasas"][codigo] = valor_float

        return data_final

    except Exception as e:
        print(f"Error durante el scraping: {e}")
        return None

# Lógica principal
if __name__ == "__main__":
    resultado = obtener_tasas_bcv()
    
    if resultado:
        # Creamos la carpeta si no existe
        ruta_carpeta = 'tasasbcv'
        if not os.path.exists(ruta_carpeta):
            os.makedirs(ruta_carpeta)
        
        # Guardamos el archivo JSON
        ruta_archivo = os.path.join(ruta_carpeta, 'tasas_bcv.json')
        with open(ruta_archivo, 'w', encoding='utf-8') as f:
            json.dump(resultado, f, indent=4, ensure_ascii=False)
            
        print(f"¡Éxito! Archivo guardado en: {ruta_archivo}")
