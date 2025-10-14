 docker run --network host \
   --name directus_instance \
   --env-file .env \
   -v ./uploads:/directus/uploads \
   -v ./extensions:/directus/extensions \
   directus/directus:latest
