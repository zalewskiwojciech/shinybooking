import {Component, OnInit} from '@angular/core';
import {FormBuilder, FormGroup, Validators} from '@angular/forms';
import {RoomService} from '../room.service';
import {RoomForDetails} from '../../shared/room-for-details.model';
import {RoomAddress} from '../../shared/room-address.model';
import {DataStorageService} from '../../shared/data-storage.service';
import {HttpClient} from "@angular/common/http";

@Component({
  selector: 'app-room-add',
  templateUrl: './room-add.component.html',
  styleUrls: ['./room-add.component.css']
})
export class RoomAddComponent implements OnInit {
  readonly postalCodeRegex: RegExp = /^[0-9]{2}-[0-9]{3}$/;
  readonly numberRegex: RegExp = /^[1-9]+[0-9]*$/;
  amenitiesCheckboxData: { name: string; id: string; isChecked: boolean }[];
  equipmentCheckboxData: { name: string; id: string; isChecked: boolean }[];
  roomForm: FormGroup;
  addressForm: FormGroup;

  constructor(private fb: FormBuilder,
              private roomService: RoomService,
              private dataStorageService: DataStorageService,
              private http: HttpClient) {
  }

  ngOnInit(): void {
    this.amenitiesCheckboxData = this.roomService.getAmenitiesForDisabled().map(x => ({
      ...x,
      isChecked: false
    }));
    this.equipmentCheckboxData = this.roomService.getEquipment().map(equipment => ({
      ...equipment,
      isChecked: false
    }));

    this.addressForm = this.fb.group({
      apartmentNumber: [44, [Validators.required, Validators.pattern, Validators.min(1)]],
      buildingNumber: [3, [Validators.required, Validators.pattern, Validators.min(1)]],
      city: ['Warsaw', [Validators.required]],
      country: ['Poland', [Validators.required]],
      postalCode: [89530, [
        Validators.required,
      ]],
      street: ['Bar'],
    });

    this.roomForm = this.fb.group({
      id: ['id123', Validators.required],
      area: [44, [Validators.required, Validators.pattern(this.numberRegex)]],
      name: ['Test', Validators.required],
      description: ['Test description', Validators.required],
      capacity: [5, [Validators.required, Validators.pattern(this.numberRegex)]],
      parkingSpace: [false],
      roomArrangementsCapabilitiesDescription: ['Sample', Validators.required],
      price: [80, [Validators.required, Validators.pattern(this.numberRegex)]],
      roomAddress: this.addressForm,
      amenities: [this.amenitiesCheckboxData],
      equipment: [this.equipmentCheckboxData],
      photos: []
    });

    this.roomForm.valueChanges.subscribe(console.log);
  }

  // todo nagłówek dla amenities i eq i zrozdzielenie sekcji
  onSubmit() {
    console.log('Form submitted');
    this.photosUpload(this.roomForm.value.photos.target.files);
    // filter amenities and equipment, so there will be only checked ones
    this.roomForm.value.amenities = this.roomForm.value.amenities.filter(amenity => amenity.isChecked === true);
    this.roomForm.value.equipment = this.roomForm.value.equipment.filter(equipment => equipment.isChecked === true);
    // remove field "isChecked"
    this.roomForm.value.amenities.map(amenity => delete amenity.isChecked);
    this.roomForm.value.equipment.map(equipment => delete equipment.isChecked);
    let submittedAdressFormValue = this.addressForm.value;
    const address = new RoomAddress(submittedAdressFormValue.buildingNumber,
      submittedAdressFormValue.city,
      submittedAdressFormValue.country,
      submittedAdressFormValue.postalCode,
      submittedAdressFormValue.apartmentNumber,
      submittedAdressFormValue.street,
    );
    let submittedRoomFormValue = this.roomForm.value;
    //TODO od razu tworzyć roomToAddDto i wysyłać bezpośrednio na backend, bo tu service przetwarza rfd na rtad przed wysłaniem
    const newRoom = new RoomForDetails(
      submittedRoomFormValue.amenities,
      submittedRoomFormValue.area,
      submittedRoomFormValue.capacity,
      submittedRoomFormValue.id,
      submittedRoomFormValue.name,
      submittedRoomFormValue.description,
      submittedRoomFormValue.equipment,
      submittedRoomFormValue.parkingSpace,
      address,
      submittedRoomFormValue.roomArrangementsCapabilitiesDescription,
    );
    console.log('New room:');
    console.log(newRoom);

    this.dataStorageService.storeRoom(newRoom);
    // todo when successfully added redirect to /rooms
    this.resetForm();
  }

  resetForm() {
    this.roomForm.value.amenities = this.amenitiesCheckboxData.slice();
    this.roomForm.value.equipment = this.equipmentCheckboxData.slice();
  }

  onFileSelected(event) {
    console.log(event);
  }

  photosUpload(photos: File[]) {
    for (let photo of photos) {
      if (this.isImage(photo)) {
        const fd = new FormData();
        fd.append('image', photo);
        fd.append('api_key', '124GJOST273d586da801d9c0568b281d484b27a3');
        this.http.post(
          'https://api.imageshack.com/v2/images', fd)
          .subscribe(res => {
            //fetch URL from reponse and save in photoURLs array
          })
      }
    }
  }

  //check if file is an image
  isImage(file){
    return file && file['type'].split('/')[0] === 'image';
  }
}
