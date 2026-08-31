from google.genai import types
from llm import get_client

def generate_image(prompt: str) -> bytes:
    """Uses google.genai client to call Imagen 3 or fallback to Gemini image gen. Returns image bytes."""
    client = get_client()
    
    try:
        # Attempt Imagen 3
        result = client.models.generate_images(
            model='imagen-3.0-generate-002',
            prompt=prompt,
            config=types.GenerateImagesConfig(
                number_of_images=1,
                output_mime_type="image/png"
            )
        )
        if result.generated_images and len(result.generated_images) > 0:
            return result.generated_images[0].image.image_bytes
        else:
            raise ValueError("No images returned from Imagen 3.")
    except Exception as e:
        print(f"Imagen 3 generation failed: {e}. Falling back to gemini-2.0-flash-preview-image-generation.")
        
    try:
        # Fallback to gemini-2.0-flash-preview-image-generation
        result = client.models.generate_images(
            model='gemini-2.0-flash-preview-image-generation',
            prompt=prompt,
            config=types.GenerateImagesConfig(
                number_of_images=1,
                output_mime_type="image/png"
            )
        )
        if result.generated_images and len(result.generated_images) > 0:
            return result.generated_images[0].image.image_bytes
        else:
            raise ValueError("No images returned from fallback model.")
    except Exception as e:
        raise RuntimeError(f"Image generation failed completely. Error: {str(e)}")
