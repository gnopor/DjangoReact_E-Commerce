# Generated by Django 2.2.10 on 2020-05-30 15:11

from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):

    dependencies = [
        ('core', '0002_itemvariation_variation'),
    ]

    operations = [
        migrations.AlterField(
            model_name='itemvariation',
            name='attachment',
            field=models.ImageField(blank=True, upload_to=''),
        ),
        migrations.AlterField(
            model_name='itemvariation',
            name='variation',
            field=models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, to='core.Variation'),
        ),
    ]
