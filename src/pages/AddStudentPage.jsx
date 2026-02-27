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



const generateAdmissionNumber = () => {
  const now = Date.now().toString();
  const randomPart = Math.floor(100 + Math.random() * 900);
  return `ADM-${now.slice(-6)}${randomPart}`;
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
      rollNumber: formData.get("rollNumber"),
      className: resolvedClassName,
      admissionNumber,
      totalFee,
      paidAmount,
      pendingAmount,
      photoPreview,
    };

    try {
      await addStudent(student);
      alert("Student saved!");
      navigate("/students");
    } catch {
      setFormError("Failed to save student");
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

          {/* PERSONAL */}
          <section className={section}>
            <h2 className={sectionTitle}>Personal Details</h2>

            <div className={grid}>
              <label className={label}>
                <span className={labelText}>Full Name</span>
                <input name="fullName" required className={input} />
              </label>

              <label className={label}>
                <span className={labelText}>Admission Number</span>
                <input value={admissionNumber} readOnly className={input} />
              </label>

              <label className={label}>
                <span className={labelText}>Roll Number</span>
                <input name="rollNumber" required className={input} />
              </label>

              <label className={label}>
                <span className={labelText}>Gender</span>
                <CustomSelect name="gender" options={genderOptions} required />
              </label>

              <label className={label}>
                <span className={labelText}>Class</span>
                <CustomSelect
                  name="className"
                  options={classDropdownOptions}
                  value={selectedClass}
                  onChange={setSelectedClass}
                  required
                />
              </label>

              <label className={label}>
                <span className={labelText}>Address</span>
                <textarea name="address" rows={2} className={textarea} />
              </label>
            </div>
          </section>

          {/* FEES */}
          <section className={section}>
            <h2 className={sectionTitle}>Fee Details</h2>

            <div className={grid}>
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
                <span className={labelText}>Pending</span>
                <input value={pendingAmount} readOnly className={input} />
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