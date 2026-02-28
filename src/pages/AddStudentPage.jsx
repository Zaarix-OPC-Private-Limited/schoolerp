import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import CustomSelect from "../components/CustomSelect";
import { useAppContext } from "../context/AppContext";

const input =
  "w-full rounded-xl border border-slate-300 bg-slate-50 px-4 py-2.5 text-sm text-slate-900 transition-colors placeholder:text-slate-400 hover:border-slate-400 focus:border-cyan-500 focus:bg-white focus:outline-none focus:ring-4 focus:ring-cyan-500/10";

const textarea =
  "w-full rounded-xl border border-slate-300 bg-slate-50 px-4 py-2.5 text-sm text-slate-900 transition-colors placeholder:text-slate-400 hover:border-slate-400 focus:border-cyan-500 focus:bg-white focus:outline-none focus:ring-4 focus:ring-cyan-500/10";

const label = "flex flex-col gap-2";
const labelText = "text-sm font-semibold text-slate-700";
const grid = "grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3";
const section =
  "mb-10 border-b border-slate-100 pb-10 last:border-0 last:pb-0";
const sectionTitle =
  "mb-6 text-lg font-bold tracking-tight text-slate-800 flex items-center gap-3 before:h-6 before:w-1.5 before:rounded-full before:bg-cyan-500";

const submitBtn =
  "rounded-xl bg-cyan-600 px-8 py-3.5 font-bold text-white shadow-md transition-all hover:bg-cyan-700 hover:shadow-lg hover:-translate-y-0.5 focus:outline-none focus:ring-4 focus:ring-cyan-500/30 active:translate-y-0";

const genderOptions = [
  { value: "male", label: "Male" },
  { value: "female", label: "Female" },
  { value: "other", label: "Other" },
];

const bloodGroupOptions = [
  { value: "A+", label: "A+" },
  { value: "A-", label: "A-" },
  { value: "B+", label: "B+" },
  { value: "B-", label: "B-" },
  { value: "AB+", label: "AB+" },
  { value: "AB-", label: "AB-" },
  { value: "O+", label: "O+" },
  { value: "O-", label: "O-" },
];

const categoryOptions = [
  { value: "General", label: "General" },
  { value: "OBC", label: "OBC" },
  { value: "SC", label: "SC" },
  { value: "ST", label: "ST" },
  { value: "Other", label: "Other" },
];

const religionOptions = [
  { value: "Hindu", label: "Hindu" },
  { value: "Muslim", label: "Muslim" },
  { value: "Sikh", label: "Sikh" },
  { value: "Christian", label: "Christian" },
  { value: "Other", label: "Other" },
];

const transportOptions = [
  { value: "Self", label: "Self" },
  { value: "School Bus", label: "School Bus" },
  { value: "Private Van", label: "Private Van" },
  { value: "Public Transport", label: "Public Transport" },
];

const statusOptions = [
  { value: "Active", label: "Active" },
  { value: "Inactive", label: "Inactive" },
  { value: "Pending Admission", label: "Pending Admission" },
];

const generateAdmissionNumber = () => {
  const hex = crypto.randomUUID().replace(/-/g, '').slice(0, 8).toUpperCase();
  return `ADM-${hex}`;
};

function AddStudentPage() {
  const navigate = useNavigate();
  const { addStudent, classRecords } = useAppContext();

  const classDropdownOptions = useMemo(() => {
    return (classRecords || []).map((c) => ({
      value: c._id || c.id,
      label: `${c.name} - ${c.section}`,
    }));
  }, [classRecords]);

  const [selectedClass, setSelectedClass] = useState("");
  const [admissionNumber] = useState(generateAdmissionNumber);

  // Custom states for calculations or selects
  const [totalFee, setTotalFee] = useState("");
  const [paidAmount, setPaidAmount] = useState("");
  const [photoPreview, setPhotoPreview] = useState("");
  const [formError, setFormError] = useState("");

  const pendingAmount = useMemo(() => {
    const total = Number(totalFee || 0);
    const paid = Number(paidAmount || 0);
    return Math.max(total - paid, 0).toFixed(2);
  }, [totalFee, paidAmount]);

  const handlePhotoChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => setPhotoPreview(reader.result);
    reader.readAsDataURL(file);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);

    const classId = formData.get("className");
    const classRec = (classRecords || []).find((c) => c._id === classId || c.id === classId);
    const resolvedClassName = classRec ? `${classRec.name} - ${classRec.section}` : classId;

    const student = {
      id: Date.now().toString(),
      name: formData.get("fullName"),
      admissionNumber,
      rollNumber: formData.get("rollNumber"),
      className: resolvedClassName,
      section: classRec?.section || "", // Will be extracted from resolved Class Name later if needed
      dob: formData.get("dob"),
      gender: formData.get("gender"),
      bloodGroup: formData.get("bloodGroup"),
      category: formData.get("category"),
      religion: formData.get("religion"),
      aadharLast4: formData.get("aadharNumber"), // User requested "Aadhaar Number (Optional)"
      admissionDate: formData.get("admissionDate"),
      studentStatus: formData.get("studentStatus") || "Active",
      // Class Applying For is technically `className` resolved above.
      address: formData.get("address"),

      fatherName: formData.get("fatherName"),
      fatherContact: formData.get("fatherContact"),
      fatherEmail: formData.get("fatherEmail"),
      motherName: formData.get("motherName"),
      motherContact: formData.get("motherContact"),
      guardianName: formData.get("guardianName"),
      guardianRelation: formData.get("guardianRelation"),
      guardianContact: formData.get("guardianContact"),
      emergencyContact: formData.get("emergencyContact"),

      transportMode: formData.get("transportMode"),
      busRoute: formData.get("busRoute"),
      pickupPoint: formData.get("pickupPoint"),
      driverName: formData.get("driverName"),
      driverContactNumber: formData.get("driverContactNumber"),
      vehicleNumber: formData.get("vehicleNumber"),

      previousSchool: formData.get("previousSchool"),
      previousPerformance: formData.get("lastClassPassed"),
      previousSchoolBoard: formData.get("previousSchoolBoard"),
      transferCertificateNumber: formData.get("transferCertificateNumber"),

      feeCategory: formData.get("feeCategory"),
      scholarship: formData.get("scholarship"),
      concessionAmount: Number(formData.get("concessionAmount") || 0),
      paymentHistory: formData.get("paymentHistory"),

      // Keep state values
      totalFee: Number(totalFee || 0),
      paidAmount: Number(paidAmount || 0),
      pendingAmount: Number(pendingAmount || 0),
      photoPreview,
    };

    try {
      await addStudent(student);
      navigate("/students");
    } catch (err) {
      setFormError(err?.message || "Failed to save student. Please try again.");
    }
  };

  return (
    <motion.section
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      className="min-h-screen bg-slate-50 text-slate-900 relative"
    >
      <div className="mx-auto max-w-5xl px-5 py-10">

        <form
          onSubmit={handleSubmit}
          className="rounded-2xl border border-slate-200 bg-white p-8 shadow-xl"
        >
          {formError && (
            <p className="mb-6 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm font-semibold text-amber-800">
              {formError}
            </p>
          )}

          {/* PHOTO */}
          <section className={section}>
            <h2 className={sectionTitle}>Student Photo</h2>

            <div className="flex gap-6 items-center">
              <div className="h-28 w-28 overflow-hidden rounded-xl border bg-slate-100 flex items-center justify-center">
                {photoPreview ? (
                  <img src={photoPreview} className="h-full w-full object-cover" />
                ) : (
                  <span className="text-slate-400 text-sm">No Image</span>
                )}
              </div>

              <input
                type="file"
                accept="image/*"
                onChange={handlePhotoChange}
                required
                className="block text-sm"
              />
            </div>
          </section>

          {/* PERSONAL & GENERAL LOGISTICS */}
          <section className={section}>
            <h2 className={sectionTitle}>Personal Details</h2>

            <div className={grid}>
              <label className={label}>
                <span className={labelText}>Full Name *</span>
                <input name="fullName" required className={input} placeholder="John Doe" />
              </label>

              <label className={label}>
                <span className={labelText}>Admission Number *</span>
                <input value={admissionNumber} readOnly className={input} />
              </label>

              <label className={label}>
                <span className={labelText}>Roll Number *</span>
                <input name="rollNumber" required className={input} placeholder="e.g. 101" />
              </label>

              <label className={label}>
                <span className={labelText}>Class Applying For *</span>
                <CustomSelect
                  name="className"
                  options={classDropdownOptions}
                  value={selectedClass}
                  onChange={setSelectedClass}
                  required
                />
              </label>

              <label className={label}>
                <span className={labelText}>Section</span>
                <input value={(classRecords || []).find((c) => c._id === selectedClass || c.id === selectedClass)?.section || ''} readOnly className={input} placeholder="Auto-fills from class" />
              </label>

              <label className={label}>
                <span className={labelText}>Date of Birth *</span>
                <input type="date" name="dob" required className={input} />
              </label>

              <label className={label}>
                <span className={labelText}>Gender *</span>
                <CustomSelect name="gender" options={genderOptions} required />
              </label>

              <label className={label}>
                <span className={labelText}>Blood Group</span>
                <CustomSelect name="bloodGroup" options={bloodGroupOptions} />
              </label>

              <label className={label}>
                <span className={labelText}>Category</span>
                <CustomSelect name="category" options={categoryOptions} />
              </label>

              <label className={label}>
                <span className={labelText}>Religion</span>
                <CustomSelect name="religion" options={religionOptions} />
              </label>

              <label className={label}>
                <span className={labelText}>Aadhaar Number (Optional)</span>
                <input name="aadharNumber" maxLength={12} className={input} placeholder="12 Digit Aadhaar" />
              </label>

              <label className={label}>
                <span className={labelText}>Admission Date *</span>
                <input type="date" name="admissionDate" required className={input} defaultValue={new Date().toISOString().split('T')[0]} />
              </label>

              <label className={label}>
                <span className={labelText}>Current Status *</span>
                <CustomSelect name="studentStatus" options={statusOptions} required />
              </label>

              <label className={`${label} sm:col-span-2 lg:col-span-3`}>
                <span className={labelText}>Address *</span>
                <textarea name="address" required rows={2} className={textarea} placeholder="Full residential physical address" />
              </label>
            </div>
          </section>

          {/* PARENT / GUARDIAN */}
          <section className={section}>
            <h2 className={sectionTitle}>Parent / Guardian Details</h2>
            <div className={grid}>
              <label className={label}>
                <span className={labelText}>Father Full Name *</span>
                <input name="fatherName" required className={input} placeholder="Father's name" />
              </label>
              <label className={label}>
                <span className={labelText}>Father Contact Number *</span>
                <input name="fatherContact" type="tel" required className={input} placeholder="+1..." />
              </label>
              <label className={label}>
                <span className={labelText}>Father Email</span>
                <input name="fatherEmail" type="email" className={input} placeholder="father@example.com" />
              </label>

              <label className={label}>
                <span className={labelText}>Mother Full Name *</span>
                <input name="motherName" required className={input} placeholder="Mother's name" />
              </label>
              <label className={label}>
                <span className={labelText}>Mother Contact Number *</span>
                <input name="motherContact" type="tel" required className={input} placeholder="+1..." />
              </label>
              <div>{/* Empty cell for grid alignment */}</div>

              <label className={label}>
                <span className={labelText}>Guardian Full Name</span>
                <input name="guardianName" className={input} placeholder="Local Guardian (if any)" />
              </label>
              <label className={label}>
                <span className={labelText}>Guardian Relation</span>
                <input name="guardianRelation" className={input} placeholder="e.g. Uncle" />
              </label>
              <label className={label}>
                <span className={labelText}>Guardian Contact Number</span>
                <input name="guardianContact" type="tel" className={input} placeholder="+1..." />
              </label>

              <label className={`${label} sm:col-span-2 lg:col-span-3`}>
                <span className={labelText}>Emergency Contact Number *</span>
                <input name="emergencyContact" type="tel" required className={input} placeholder="Primary emergency contact" />
              </label>
            </div>
          </section>

          {/* TRANSPORT */}
          <section className={section}>
            <h2 className={sectionTitle}>Transport Details</h2>
            <div className={grid}>
              <label className={label}>
                <span className={labelText}>Mode of Transport</span>
                <CustomSelect name="transportMode" options={transportOptions} />
              </label>
              <label className={label}>
                <span className={labelText}>Bus Route</span>
                <input name="busRoute" className={input} placeholder="e.g. Route A" />
              </label>
              <label className={label}>
                <span className={labelText}>Pickup Point</span>
                <input name="pickupPoint" className={input} placeholder="e.g. Main Gate" />
              </label>

              <label className={label}>
                <span className={labelText}>Driver Name</span>
                <input name="driverName" className={input} placeholder="Assigned driver" />
              </label>
              <label className={label}>
                <span className={labelText}>Driver Contact Number</span>
                <input name="driverContactNumber" type="tel" className={input} placeholder="+1..." />
              </label>
              <label className={label}>
                <span className={labelText}>Vehicle Number</span>
                <input name="vehicleNumber" className={input} placeholder="e.g. AB 12 CD 3456" />
              </label>
            </div>
          </section>

          {/* PREVIOUS SCHOOL */}
          <section className={section}>
            <h2 className={sectionTitle}>Previous Academic Details</h2>
            <div className={grid}>
              <label className={label}>
                <span className={labelText}>Previous School Name</span>
                <input name="previousSchool" className={input} placeholder="Name of previous institution" />
              </label>
              <label className={label}>
                <span className={labelText}>Last Class Passed</span>
                <input name="lastClassPassed" className={input} placeholder="e.g. 5th Grade" />
              </label>
              <label className={label}>
                <span className={labelText}>Previous School Board</span>
                <input name="previousSchoolBoard" className={input} placeholder="e.g. CBSE / State Board" />
              </label>

              <label className={label}>
                <span className={labelText}>Transfer Certificate Number</span>
                <input name="transferCertificateNumber" className={input} placeholder="TC Number from previous school" />
              </label>
            </div>
          </section>

          {/* FEES */}
          <section className={section}>
            <h2 className={sectionTitle}>Fee Details</h2>

            <div className={grid}>
              <label className={label}>
                <span className={labelText}>Fee Category</span>
                <input name="feeCategory" className={input} placeholder="e.g. General / Staff Child" />
              </label>
              <label className={label}>
                <span className={labelText}>Total Fee</span>
                <input
                  type="number"
                  value={totalFee}
                  onChange={(e) => setTotalFee(e.target.value)}
                  className={input}
                />
              </label>

              <label className={label}>
                <span className={labelText}>Paid Amount</span>
                <input
                  type="number"
                  value={paidAmount}
                  onChange={(e) => setPaidAmount(e.target.value)}
                  className={input}
                />
              </label>

              <label className={label}>
                <span className={labelText}>Pending Amount (Auto Calculated)</span>
                <input value={pendingAmount} readOnly className={`${input} bg-slate-100 font-bold`} />
              </label>

              <label className={label}>
                <span className={labelText}>Scholarship / Concession</span>
                <input name="scholarship" className={input} placeholder="e.g. Merit Scholarship" />
              </label>

              <label className={label}>
                <span className={labelText}>Scholarship / Concession Amount</span>
                <input name="concessionAmount" type="number" className={input} placeholder="0" />
              </label>

              <label className={`${label} sm:col-span-2 lg:col-span-3`}>
                <span className={labelText}>Payment History (Notes)</span>
                <textarea name="paymentHistory" rows={2} className={textarea} placeholder="Any advance notes or payment references." />
              </label>
            </div>
          </section>

          {/* DOCUMENTS */}
          <section className={section}>
            <h2 className={sectionTitle}>Required Documents</h2>
            <div className={grid}>
              <label className={label}>
                <span className={labelText}>Birth Certificate</span>
                <input type="file" name="birthCertificate" className="block text-sm text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-sm file:font-semibold file:bg-cyan-50 file:text-cyan-700 hover:file:bg-cyan-100" />
              </label>
              <label className={label}>
                <span className={labelText}>Previous Class Marksheet</span>
                <input type="file" name="previousMarksheet" className="block text-sm text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-sm file:font-semibold file:bg-cyan-50 file:text-cyan-700 hover:file:bg-cyan-100" />
              </label>
              <label className={label}>
                <span className={labelText}>10th Marksheet (Class 12 entries)</span>
                <input type="file" name="tenthMarksheet" className="block text-sm text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-sm file:font-semibold file:bg-cyan-50 file:text-cyan-700 hover:file:bg-cyan-100" />
              </label>
            </div>
          </section>

          <div className="flex justify-end pt-6">
            <button type="submit" className={submitBtn}>
              Save Student
            </button>
          </div>
        </form>
      </div>
    </motion.section>
  );
}

export default AddStudentPage;